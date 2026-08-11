import { generateRegistrationOptions } from "@simplewebauthn/server";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth-options";
import { connectToDatabase } from "@/lib/mongodb";
import { getRpId, RP_NAME, WEBAUTHN_CHALLENGE_TTL_MS } from "@/lib/webauthn";
import { User } from "@/models";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  await connectToDatabase();
  const user = await User.findById(session.user.id);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: getRpId(),
    userID: new TextEncoder().encode(user._id.toString()),
    userName: user.email,
    userDisplayName: user.name,
    attestationType: "none",
    excludeCredentials: user.webauthnCredentials.map((c) => ({
      id: c.credentialId,
      transports: c.transports as ("ble" | "cable" | "hybrid" | "internal" | "nfc" | "smart-card" | "usb")[],
    })),
    authenticatorSelection: {
      residentKey: "required",
      userVerification: "required",
      authenticatorAttachment: "platform",
    },
  });

  user.webauthnChallenge = options.challenge;
  user.webauthnChallengeExpiresAt = new Date(Date.now() + WEBAUTHN_CHALLENGE_TTL_MS);
  await user.save();

  return NextResponse.json(options);
}
