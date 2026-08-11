import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { NextResponse, type NextRequest } from "next/server";

import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { webauthnAuthOptionsSchema } from "@/lib/validation/webauthn";
import { getRpId, WEBAUTHN_CHALLENGE_TTL_MS } from "@/lib/webauthn";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models";

const WEBAUTHN_OPTIONS_RATE_LIMIT = { max: 20, windowMs: 10 * 60 * 1000 };

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = webauthnAuthOptionsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const ip = await getClientIp();
  const rateLimit = await checkRateLimit(`webauthn-options:${email}:${ip}`, WEBAUTHN_OPTIONS_RATE_LIMIT);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many attempts. Please try again shortly." }, { status: 429 });
  }

  await connectToDatabase();
  const user = await User.findOne({ email });

  if (!user || user.webauthnCredentials.length === 0) {
    return NextResponse.json(
      { error: "No fingerprint login is set up for this account." },
      { status: 404 }
    );
  }

  const options = await generateAuthenticationOptions({
    rpID: getRpId(),
    userVerification: "required",
    allowCredentials: user.webauthnCredentials.map((c) => ({
      id: c.credentialId,
      transports: c.transports as ("ble" | "cable" | "hybrid" | "internal" | "nfc" | "smart-card" | "usb")[],
    })),
  });

  user.webauthnChallenge = options.challenge;
  user.webauthnChallengeExpiresAt = new Date(Date.now() + WEBAUTHN_CHALLENGE_TTL_MS);
  await user.save();

  return NextResponse.json(options);
}
