import { getServerSession } from "next-auth";
import { NextResponse, type NextRequest } from "next/server";

import { authOptions } from "@/lib/auth-options";
import { connectToDatabase } from "@/lib/mongodb";
import { webauthnPreferenceSchema } from "@/lib/validation/webauthn";
import { User } from "@/models";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = webauthnPreferenceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  await connectToDatabase();
  const user = await User.findById(session.user.id);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  user.fingerprintPromptDismissed = parsed.data.dismissed;
  await user.save();

  return NextResponse.json({ ok: true });
}
