import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations";
import { generateResetToken, hashToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";

const GENERIC_MESSAGE =
  "If an account with that email exists, a verification email has been sent.";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 });
    }

    const { email } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Only resend if user exists and is not yet verified
    if (user && !user.emailVerified) {
      // Invalidate old tokens for this user
      await prisma.verificationToken.deleteMany({
        where: { userId: user.id },
      });

      // Create new token
      const rawToken = generateResetToken();
      const tokenHash = hashToken(rawToken);

      await prisma.verificationToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });

      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const verifyUrl = `${baseUrl}/verify-email/${rawToken}`;

      try {
        await sendVerificationEmail({ to: user.email, verifyUrl });
      } catch (emailError) {
        console.error("Failed to resend verification email:", emailError);
      }
    }

    return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 });
  }
}
