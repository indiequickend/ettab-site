import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { getServerSession } from "next-auth";
import { NextResponse, type NextRequest } from "next/server";

import { authOptions } from "@/lib/auth-options";
import { connectToDatabase } from "@/lib/mongodb";
import { getOrigin, getRpId } from "@/lib/webauthn";
import { User } from "@/models";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ verified: false, error: "Not authenticated." }, { status: 401 });
  }

  await connectToDatabase();
  const user = await User.findById(session.user.id);
  if (!user) {
    return NextResponse.json({ verified: false, error: "Not authenticated." }, { status: 401 });
  }

  if (
    !user.webauthnChallenge ||
    !user.webauthnChallengeExpiresAt ||
    user.webauthnChallengeExpiresAt < new Date()
  ) {
    return NextResponse.json(
      { verified: false, error: "Challenge expired, please try again." },
      { status: 400 }
    );
  }

  const body = await request.json();

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: body.response,
      expectedChallenge: user.webauthnChallenge,
      expectedOrigin: getOrigin(),
      expectedRPID: getRpId(),
    });
  } catch (err) {
    console.error("WebAuthn registration verification failed", err);
    return NextResponse.json({ verified: false, error: "Verification failed." }, { status: 400 });
  }

  if (!verification.verified || !verification.registrationInfo) {
    user.webauthnChallenge = null;
    user.webauthnChallengeExpiresAt = null;
    await user.save();
    return NextResponse.json({ verified: false, error: "Verification failed." }, { status: 400 });
  }

  const { credential } = verification.registrationInfo;

  user.webauthnCredentials.push({
    credentialId: credential.id,
    publicKey: Buffer.from(credential.publicKey),
    counter: credential.counter,
    transports: credential.transports ?? [],
    createdAt: new Date(),
  });
  user.webauthnChallenge = null;
  user.webauthnChallengeExpiresAt = null;
  await user.save();

  return NextResponse.json({ verified: true });
}
