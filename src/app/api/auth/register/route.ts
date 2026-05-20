import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/hash";
import { registerSchema } from "@/lib/validations";
import { generateResetToken, hashToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      return NextResponse.json(
        { message: "Validation failed", errors },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // Check for existing user — generic error to avoid email enumeration
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Unable to create account. Please try a different email." },
        { status: 409 }
      );
    }

    // Hash password on the server
    const passwordHash = await hashPassword(password);

    // Create user with default role
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "USER",
      },
    });

    // Generate verification token
    const rawToken = generateResetToken();
    const tokenHash = hashToken(rawToken);

    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      },
    });

    // Send verification email — don't block registration if it fails
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const verifyUrl = `${baseUrl}/verify-email/${rawToken}`;

    try {
      await sendVerificationEmail({ to: user.email, verifyUrl });
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
    }

    return NextResponse.json(
      { message: "Account created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
