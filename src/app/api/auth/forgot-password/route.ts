import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations";
import { generateResetToken, hashToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/email";

/** Always return the same message to prevent email enumeration. */
const GENERIC_MESSAGE =
  "If an account with that email exists, a reset link has been sent.";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      // Still return generic message even on validation failure
      return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 });
    }

    const { email } = parsed.data;

    // Look up user — do NOT reveal whether the email exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // Generate a random token
      const rawToken = generateResetToken();
      const tokenHash = hashToken(rawToken);

      // Store hashed token in DB with 30-minute expiry
      await prisma.resetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        },
      });

      // Build reset URL
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const resetUrl = `${baseUrl}/auth?mode=reset-password&token=${rawToken}`;

      // Send email (or log to console in dev)
      try {
        await sendPasswordResetEmail({ to: user.email, resetUrl });
      } catch (emailError) {
        console.error("Failed to send password reset email:", emailError);
      }
    }

    // Always return success
    return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 });
  } catch (error) {
    console.error("Forgot password error:", error);
    // Even on error, return generic success to prevent timing attacks
    return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 });
  }
}
