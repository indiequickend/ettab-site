import Link from "next/link";
import { getServerSession } from "next-auth";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authOptions } from "@/lib/auth-options";
import { connectToDatabase } from "@/lib/mongodb";
import { hashToken } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import { Invite, User, type ICompany } from "@/models";
import { ConfirmJoinForm } from "./confirm-join-form";
import { CreateAccountAndJoinForm } from "./create-account-form";

function InfoCard({ title, description }: { title: string; description: string }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
            Go to login
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}

export default async function InviteAcceptPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <InfoCard title="Invite link invalid" description="This invite link is missing a token." />
    );
  }

  await connectToDatabase();
  const tokenHash = hashToken(token);
  const invite = await Invite.findOne({
    tokenHash,
    status: "pending",
    expiresAt: { $gt: new Date() },
  }).populate<{ companyId: ICompany }>("companyId");

  if (!invite || !invite.companyId) {
    return (
      <InfoCard
        title="Invite link invalid"
        description="This invite link is invalid, has expired, or has already been used."
      />
    );
  }

  const companyName = invite.companyId.name;
  const session = await getServerSession(authOptions);

  if (session?.user?.email) {
    if (session.user.email.toLowerCase() !== invite.email) {
      return (
        <InfoCard
          title="Invite link invalid"
          description={`This invite was sent to a different email address (${invite.email}). Log out and try again.`}
        />
      );
    }

    const user = await User.findById(session.user.id).lean();

    return (
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
        <Card className="w-full max-w-md text-left">
          <CardHeader>
            <CardTitle>Join {companyName}</CardTitle>
            <CardDescription>
              You&apos;re signed in as {session.user.email}. Confirm your contact details for this
              company to finish joining.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConfirmJoinForm
              token={token}
              defaultName={session.user.name ?? ""}
              defaultPhone={user?.phone ?? ""}
            />
          </CardContent>
        </Card>
      </main>
    );
  }

  const existingUser = await User.findOne({ email: invite.email }).lean();

  if (existingUser) {
    return (
      <InfoCard
        title={`Join ${companyName}`}
        description={`An account already exists for ${invite.email}. Log in, then reopen this invite link from your email to finish joining.`}
      />
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
      <Card className="w-full max-w-md text-left">
        <CardHeader>
          <CardTitle>Join {companyName}</CardTitle>
          <CardDescription>
            Create your ETTAB Member account to join {companyName} as a partner.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateAccountAndJoinForm token={token} defaultEmail={invite.email} />
        </CardContent>
      </Card>
    </main>
  );
}
