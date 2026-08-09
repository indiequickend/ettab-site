import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth-options";
import { AdminSignOutButton } from "./sign-out-button";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.roles.includes("superadmin")) {
    redirect("/admin/login");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Welcome, Site Administrator
      </h1>
      <p className="max-w-sm text-sm text-muted-foreground sm:text-base">
        Member approval, role management, and site settings will live here.
      </p>
      <AdminSignOutButton />
    </main>
  );
}
