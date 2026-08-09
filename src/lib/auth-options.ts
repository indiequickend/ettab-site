import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { RATE_LIMIT_ERROR_CODE } from "@/lib/auth-messages";
import { connectToDatabase } from "@/lib/mongodb";
import { verifyPassword } from "@/lib/password";
import { checkRateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation/auth";
import { Role, User } from "@/models";

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
