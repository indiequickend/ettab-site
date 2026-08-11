import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth-options";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  await connectToDatabase();
  const user = await User.findById(session.user.id)
    .select("webauthnCredentials fingerprintPromptDismissed")
    .lean();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  return NextResponse.json({
    hasCredential: user.webauthnCredentials.length > 0,
    promptDismissed: user.fingerprintPromptDismissed,
  });
}
