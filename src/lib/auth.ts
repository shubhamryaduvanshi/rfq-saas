import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { loginSchema } from "@/lib/validators/auth";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        try {
          await connectDB();
        } catch (error) {
          console.log("error connecting db::", error);
        }
        const user = await User.findOne({
          email,
          provider: "credentials",
        }).exec();

        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;
        return {
          id: user._id.toString(),
          name: user.name ?? undefined,
          email: user.email,
          image: user.image ?? undefined,
          company: user.company?.toString() ?? null,
          role: user.role,
        } as any;
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      await connectDB();

      if (account?.provider === "google") {
        const existing = await User.findOne({ email: user.email }).exec();
        // if (!existing) {
        //   const created = await User.create({
        //     name: user.name,
        //     email: user.email,
        //     image: user.image,
        //     provider: "google",
        //     providerId: account.providerAccountId,
        //     role: "owner",
        //   });
        //   (user as any).id = created._id.toString();
        //   (user as any).companyId = created.company?.toString() ?? null;
        //   (user as any).role = created.role;
        // } else {
        //   console.log("SETTING USER CONTEXT::", existing);

        //   (user as any).id = existing._id.toString();
        //   (user as any).companyId = existing.company?.toString() ?? null;
        //   (user as any).role = existing.role;
        // }

      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        (token as any).companyId = (user as any).company ?? null;
        (token as any).role = (user as any).role ?? "member";
      }
      return token;
    },
    async session({ session, token }) {
      console.log("SESSION HIT:::", session, token);

      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).company = (token as any).companyId;
        (session.user as any).role = (token as any).role;
      }
      return session;
    },
  },
};

