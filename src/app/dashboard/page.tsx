import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth-options";
import { SignOutButton } from "./sign-out-button";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Welcome, {session.user.name}
      </h1>
      <p className="text-sm text-muted-foreground sm:text-base">
        Roles: {session.user.roles.join(", ") || "member"}
      </p>
      <SignOutButton />
    </main>
  );
}
