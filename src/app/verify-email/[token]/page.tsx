import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/tokens";
import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "./verify.module.css";
import { ResendVerificationButton } from "@/components/auth/ResendVerificationButton";

interface Props {
  params: { token: string };
}

export default async function VerifyEmailPage({ params }: Props) {
  try {
    const { token } = params;

    if (!token) {
      return <ErrorMessage />;
    }

    const tokenHash = hashToken(token);

    const record = await prisma.verificationToken.findFirst({
      where: { tokenHash, used: false },
      include: { user: true },
    });

    if (!record) {
      return (
        <div className={styles.page}>
          <div className={styles.card}>
            <div className={styles.icon}>⚠️</div>
            <h1 className={styles.title}>Invalid verification link</h1>
            <p className={styles.description}>
              This verification link is invalid or has already been used.
            </p>
            <Link href="/auth?mode=login" className={styles.link}>
              Back to sign in
            </Link>
          </div>
        </div>
      );
    }

    if (record.expiresAt < new Date()) {
      return (
        <div className={styles.page}>
          <div className={styles.card}>
            <div className={styles.icon}>⏰</div>
            <h1 className={styles.title}>Link expired</h1>
            <p className={styles.description}>
              This verification link has expired. You can request a new one below.
            </p>
            <ResendForm email={record.user.email} />
          </div>
        </div>
      );
    }

    // Mark user as verified and delete the token
    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { emailVerified: new Date() },
      }),
      prisma.verificationToken.delete({
        where: { id: record.id },
      }),
    ]);

    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.icon}>✅</div>
          <h1 className={styles.title}>Email verified</h1>
          <p className={styles.description}>
            Your email has been successfully verified. You can now sign in to your
            account.
          </p>
          <Link href="/auth?mode=login&verified=true" className={styles.link}>
            Sign in
          </Link>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Verification error:", error);
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.icon}>❌</div>
          <h1 className={styles.title}>Verification failed</h1>
          <p className={styles.description}>
            Something went wrong while verifying your email. Please try again or
            request a new verification link.
          </p>
          <Link href="/auth?mode=login" className={styles.link}>
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }
}

function ErrorMessage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.icon}>⚠️</div>
        <h1 className={styles.title}>Invalid verification link</h1>
        <p className={styles.description}>
          This verification link is invalid or has already been used.
        </p>
        <Link href="/auth?mode=login" className={styles.link}>
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

function ResendForm({ email }: { email: string }) {
  return (
    <div className={styles.resendForm}>
      <ResendVerificationButton email={email} />
      <p className={styles.footer}>
        <Link href="/auth?mode=login">Back to sign in</Link>
      </p>
    </div>
  );
}
