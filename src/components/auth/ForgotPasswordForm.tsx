"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input/Input";
import { Button } from "@/components/ui/Button/Button";
import { Alert } from "@/components/ui/Alert/Alert";
import styles from "./AuthForm.module.css";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      // Always show success regardless of API response
      setSubmitted(true);
    } catch {
      // Even on network error, show success to prevent enumeration
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className={styles.form}>
        <h1 className={styles.title}>Check your email</h1>
        <Alert variant="success">
          If an account with that email exists, we&apos;ve sent a password reset
          link. Please check your inbox.
        </Alert>
        <p className={styles.footer}>
          <Link href="/auth?mode=login">Back to sign in</Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      <h1 className={styles.title}>Forgot your password?</h1>
      <p className={styles.footer}>
        Enter your email address and we&apos;ll send you a link to reset your
        password.
      </p>

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        autoComplete="email"
        required
      />

      <Button type="submit" disabled={loading}>
        {loading ? "Sending..." : "Send reset link"}
      </Button>

      <p className={styles.footer}>
        Remember your password?{" "}
        <Link href="/auth?mode=login">Sign in</Link>
      </p>
    </form>
  );
}
