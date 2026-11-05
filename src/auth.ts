import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { User } from "@/models/User";

export const providerFlags = {
  google: !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
  apple: !!(process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET),
};

const providers: NextAuthConfig["providers"] = [];
if (providerFlags.google) providers.push(Google({ allowDangerousEmailAccountLinking: true }));
if (providerFlags.apple) providers.push(Apple({ allowDangerousEmailAccountLinking: true }));
providers.push(
  Credentials({
    credentials: { email: {}, password: {} },
    async authorize(raw) {
      const parsed = z.object({ email: z.string().email(), password: z.string().min(6) }).safeParse(raw);
      if (!parsed.success) return null;
      await db();
      const u = await User.findOne({ email: parsed.data.email.toLowerCase() }).select("+passwordHash");
      if (!u?.passwordHash) return null;
      const ok = await bcrypt.compare(parsed.data.password, u.passwordHash);
      if (!ok) return null;
      u.lastLoginAt = new Date();
      await u.save();
      return { id: String(u._id), email: u.email, name: u.name };
    },
  }),
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: "/en/login", error: "/en/login" },
  providers,
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user && account) {
        if (account.provider === "credentials") {
          token.uid = user.id;
        } else {
          await db();
          const email = (user.email || (profile as { email?: string } | undefined)?.email || "").toLowerCase();
          if (!email) throw new Error("No email returned by provider");
          const existing = await User.findOne({ email });
          if (existing) {
            if (!existing.providers.includes(account.provider)) existing.providers.push(account.provider);
            if (!existing.image && user.image) existing.image = user.image;
            if (!existing.name && user.name) existing.name = user.name;
            existing.lastLoginAt = new Date();
            await existing.save();
            token.uid = String(existing._id);
          } else {
            const created = await User.create({
              email, name: user.name || email.split("@")[0], image: user.image || "",
              providers: [account.provider], lastLoginAt: new Date(),
            });
            token.uid = String(created._id);
          }
        }
      }
      // keep the cookie small: no avatar/name in the token
      delete token.picture;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.uid as string;
        session.user.image = null;
      }
      return session;
    },
  },
});
