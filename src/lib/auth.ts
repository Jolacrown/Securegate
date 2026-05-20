import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/hash";
import { loginSchema } from "@/lib/validations";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 60 * 60, // 1 hour
  },
  pages: {
    signIn: "/auth",
    error: "/auth",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Validate input shape
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          // Generic failure — never reveal which field is wrong
          return null;
        }

        // Verify password
        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        // Return user data for JWT encoding
        return {
          id: user.id,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On initial sign-in, attach user data to the JWT
      if (user) {
        token.userId = user.id;
        token.email = user.email;
        token.role = (user as { role: string }).role;
        token.emailVerified = (user as { emailVerified: Date | null }).emailVerified?.toISOString() ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      // Expose userId, role, and emailVerified on the client session
      if (session.user) {
        (session.user as { id: string }).id = token.userId as string;
        (session.user as { role: string }).role = token.role as string;
        (session.user as { emailVerified: string | null }).emailVerified = token.emailVerified as string | null;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
