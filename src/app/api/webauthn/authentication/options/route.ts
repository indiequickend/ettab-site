import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { NextResponse } from "next/server";

import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getRpId, WEBAUTHN_CHALLENGE_TTL_MS } from "@/lib/webauthn";
import { connectToDatabase } from "@/lib/mongodb";
import { WebauthnChallenge } from "@/models";

const WEBAUTHN_OPTIONS_RATE_LIMIT = { max: 20, windowMs: 10 * 60 * 1000 };

export async function POST() {
  const ip = await getClientIp();
  const rateLimit = await checkRateLimit(`webauthn-options:${ip}`, WEBAUTHN_OPTIONS_RATE_LIMIT);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many attempts. Please try again shortly." }, { status: 429 });
  }

  const options = await generateAuthenticationOptions({
    rpID: getRpId(),
    userVerification: "required",
  });

  await connectToDatabase();
  await WebauthnChallenge.create({
    challenge: options.challenge,
    expiresAt: new Date(Date.now() + WEBAUTHN_CHALLENGE_TTL_MS),
  });

  return NextResponse.json(options);
}
