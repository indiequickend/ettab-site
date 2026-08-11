import type { AuthenticatorTransportFuture } from "@simplewebauthn/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { Types } from "mongoose";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { RATE_LIMIT_ERROR_CODE } from "@/lib/auth-messages";
import { connectToDatabase } from "@/lib/mongodb";
import { verifyPassword } from "@/lib/password";
import { checkRateLimit } from "@/lib/rate-limit";
import { getOrigin, getRpId } from "@/lib/webauthn";
import { loginSchema } from "@/lib/validation/auth";
import { Role, User, WebauthnChallenge } from "@/models";

const LOGIN_RATE_LIMIT = { max: 8, windowMs: 15 * 60 * 1000 };

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const ip = req.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ?? "unknown";
        const rateLimit = await checkRateLimit(`login:${parsed.data.email.toLowerCase()}:${ip}`, LOGIN_RATE_LIMIT);
        if (!rateLimit.allowed) {
          throw new Error(RATE_LIMIT_ERROR_CODE);
        }

        await connectToDatabase();
        // Ensure Role is registered before populate() resolves roleIds.
        void Role;

        const user = await User.findOne({ email: parsed.data.email.toLowerCase() }).populate<{
          roleIds: { name: string }[];
        }>("roleIds");

        if (!user) return null;
        if (user.status !== "approved") return null;

        const isValid = await verifyPassword(parsed.data.password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          roles: user.roleIds.map((role) => role.name),
        };
      },
    }),
    CredentialsProvider({
      id: "webauthn",
      name: "Fingerprint",
      credentials: {
        response: { label: "WebAuthn response", type: "text" },
      },
      async authorize(credentials, req) {
        if (!credentials?.response) return null;

        const ip = req.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ?? "unknown";
        const rateLimit = await checkRateLimit(`webauthn-login:${ip}`, LOGIN_RATE_LIMIT);
        if (!rateLimit.allowed) {
          throw new Error(RATE_LIMIT_ERROR_CODE);
        }

        let parsedResponse;
        try {
          parsedResponse = JSON.parse(credentials.response);
        } catch {
          return null;
        }

        const userHandle = parsedResponse?.response?.userHandle;
        const clientDataJSONRaw = parsedResponse?.response?.clientDataJSON;
        if (!userHandle || !clientDataJSONRaw) return null;

        let userId: string;
        let challenge: string;
        try {
          userId = Buffer.from(userHandle, "base64url").toString("utf-8");
          const clientData = JSON.parse(Buffer.from(clientDataJSONRaw, "base64url").toString("utf-8"));
          challenge = clientData.challenge;
        } catch {
          return null;
        }
        if (!challenge || !Types.ObjectId.isValid(userId)) return null;

        await connectToDatabase();
        // Ensure Role is registered before populate() resolves roleIds.
        void Role;

        // Single-use, tied to no particular user (usernameless/discoverable-credential flow).
        const challengeDoc = await WebauthnChallenge.findOneAndDelete({
          challenge,
          expiresAt: { $gt: new Date() },
        });
        if (!challengeDoc) return null;

        const user = await User.findById(userId).populate<{
          roleIds: { name: string }[];
        }>("roleIds");

        if (!user) return null;
        if (user.status !== "approved") return null;

        const stored = user.webauthnCredentials.find((c) => c.credentialId === parsedResponse.id);
        if (!stored) return null;

        let verification;
        try {
          verification = await verifyAuthenticationResponse({
            response: parsedResponse,
            expectedChallenge: challenge,
            expectedOrigin: getOrigin(),
            expectedRPID: getRpId(),
            credential: {
              id: stored.credentialId,
              publicKey: new Uint8Array(stored.publicKey),
              counter: stored.counter,
              transports: stored.transports as AuthenticatorTransportFuture[],
            },
          });
        } catch {
          return null;
        }
        if (!verification.verified) return null;

        stored.counter = verification.authenticationInfo.newCounter;
        await user.save();

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          roles: user.roleIds.map((role) => role.name),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.roles = user.roles;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub;
      session.user.roles = token.roles ?? [];
      return session;
    },
  },
};
