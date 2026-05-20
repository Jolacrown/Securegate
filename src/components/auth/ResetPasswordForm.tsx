"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input/Input";
import { Button } from "@/components/ui/Button/Button";
import { Alert } from "@/components/ui/Alert/Alert";
import styles from "./AuthForm.module.css";

interface FieldErrors {
  password?: string[];
  confirmPassword?: string[];
  token?: string[];
}

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className={styles.form}>
        <h1 className={styles.title}>Invalid reset link</h1>
        <Alert variant="error">
          This password reset link is invalid or has expired.
        </Alert>
        <p className={styles.footer}>
          <Link href="/auth?mode=forgot-password">Request a new reset link</Link>
        </p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          setFieldErrors(data.errors);
        } else {
          setError(data.message || "Reset failed");
        }
        return;
      }

      router.push("/auth?mode=login&reset=true");
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      <h1 className={styles.title}>Set a new password</h1>

      {error && <Alert variant="error">{error}</Alert>}

      <Input
        label="New Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Min. 8 characters"
        autoComplete="new-password"
        error={fieldErrors.password?.[0]}
        required
      />

      <Input
        label="Confirm New Password"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Re-enter your new password"
        autoComplete="new-password"
        error={fieldErrors.confirmPassword?.[0]}
        required
      />

      <Button type="submit" disabled={loading}>
        {loading ? "Resetting..." : "Reset password"}
      </Button>

      <p className={styles.footer}>
        <Link href="/auth?mode=login">Back to sign in</Link>
      </p>
    </form>
  );
}
