"use client";

import React, { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button/Button";
import { Alert } from "@/components/ui/Alert/Alert";
import styles from "./AuthForm.module.css";

export function VerifyPendingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  async function handleResend() {
    if (!email) return;
    setResending(true);
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setResent(true);
    } catch {
      // Swallow — always show success to prevent enumeration
      setResent(true);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className={styles.form}>
      <h1 className={styles.title}>Verify your email</h1>

      {resent ? (
        <Alert variant="success">
          If an account with that email exists, a new verification link has been
          sent.
        </Alert>
      ) : (
        <Alert variant="info">
          We&apos;ve sent a verification link to your email. Please check your
          inbox and click the link to activate your account.
        </Alert>
      )}

      <p className={styles.footer}>
        Didn&apos;t receive the email?{" "}
        <button
          type="button"
          className={styles.linkButton}
          onClick={handleResend}
          disabled={resending}
        >
          {resending ? "Sending..." : "Resend verification email"}
        </button>
      </p>

      <p className={styles.footer}>
        <Link href="/auth?mode=login">Back to sign in</Link>
      </p>

      {email && (
        <Button variant="ghost" onClick={handleResend} disabled={resending}>
          {resending ? "Sending..." : "Resend"}
        </Button>
      )}
    </div>
  );
}
