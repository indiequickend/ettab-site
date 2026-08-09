import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const mongoose = (await import("mongoose")).default;
  const { connectToDatabase } = await import("../src/lib/mongodb");
  const { Role, User, Settings } = await import("../src/models");
  const { hashPassword } = await import("../src/lib/password");

  await connectToDatabase();

  const roleDefs = [
    { name: "superadmin", permissions: ["*"], isSystem: true },
    {
      name: "admin",
      permissions: ["members.approve", "settings.manage"],
      isSystem: true,
    },
    {
      name: "member",
      permissions: ["company.manage_own", "property.manage_own", "serviceArea.manage_own"],
      isSystem: true,
    },
  ];

  const roles: Record<string, InstanceType<typeof Role>> = {};
  for (const roleDef of roleDefs) {
    const role = await Role.findOneAndUpdate(
      { name: roleDef.name },
      { $setOnInsert: roleDef },
      { upsert: true, returnDocument: "after" }
    );
    roles[roleDef.name] = role;
    console.log(`Role ready: ${roleDef.name}`);
  }

  await Settings.findOneAndUpdate(
    { key: "singleton" },
    { $setOnInsert: { key: "singleton", autoVerification: false } },
    { upsert: true, returnDocument: "after" }
  );
  console.log("Settings singleton ready");

  const superadminEmail = process.env.SUPERADMIN_EMAIL;
  const superadminPassword = process.env.SUPERADMIN_PASSWORD;
  if (!superadminEmail || !superadminPassword) {
    throw new Error(
      "SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD must be set in the environment to seed the superadmin account."
    );
  }

  const existing = await User.findOne({ email: superadminEmail.toLowerCase() });
  if (existing) {
    console.log(`Superadmin already exists: ${superadminEmail}`);
  } else {
    const passwordHash = await hashPassword(superadminPassword);
    await User.create({
      name: process.env.SUPERADMIN_NAME || "ETTAB Site Administrator",
      email: superadminEmail.toLowerCase(),
      passwordHash,
      phone: process.env.SUPERADMIN_PHONE || "",
      emailVerified: new Date(),
      status: "approved",
      roleIds: [roles.superadmin._id],
    });
    console.log(`Superadmin created: ${superadminEmail} (no Company/CompanyPartner - not an ETTAB member)`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
