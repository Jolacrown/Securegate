"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input/Input";
import { Button } from "@/components/ui/Button/Button";
import { Alert } from "@/components/ui/Alert/Alert";
import { registerEmailFieldSchema, passwordFieldSchema, registerSchema } from "@/lib/validations";
import styles from "./AuthForm.module.css";

function getEmailError(value: string): string {
  if (!value) return "";
  const result = registerEmailFieldSchema.safeParse(value);
  if (!result.success) {
    return result.error.issues[0].message;
  }
  return "";
}

function getPasswordError(value: string): string {
  if (!value) return "";
  const result = passwordFieldSchema.safeParse(value);
  if (!result.success) {
    return result.error.issues[0].message;
  }
  return "";
}

function getConfirmPasswordError(password: string, confirm: string): string {
  if (!confirm) return "";
  return confirm !== password ? "Passwords do not match" : "";
}

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setEmail(value);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (value) {
        next.email = getEmailError(value);
      } else {
        delete next.email;
      }
      return next;
    });
  }

  function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setPassword(value);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (value) {
        next.password = getPasswordError(value);
      } else {
        delete next.password;
      }
      const confirm = prev.confirmPassword !== undefined ? prev.confirmPassword : confirmPassword;
      if (confirm) {
        next.confirmPassword = getConfirmPasswordError(value, confirm);
      }
      return next;
    });
  }

  function handleConfirmPasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setConfirmPassword(value);
    setFieldErrors((prev) => ({
      ...prev,
      ...(value ? { confirmPassword: getConfirmPasswordError(password, value) } : {}),
    }));
  }

  function getFullErrors(): Record<string, string> {
    const errors: Record<string, string> = {};
    const emailErr = getEmailError(email);
    if (emailErr) errors.email = emailErr;
    const passErr = getPasswordError(password);
    if (passErr) errors.password = passErr;
    const confirmErr = getConfirmPasswordError(password, confirmPassword);
    if (confirmErr) errors.confirmPassword = confirmErr;
    return errors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const clientErrors = getFullErrors();
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          const serverErrors: Record<string, string> = {};
          for (const [key, msgs] of Object.entries(data.errors)) {
            serverErrors[key] = (msgs as string[])[0];
          }
          setFieldErrors(serverErrors);
        } else {
          setError(data.message || "Registration failed");
        }
        return;
      }

      router.push("/auth?mode=login&registered=true");
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      <h1 className={styles.title}>Create your account</h1>

      {error && <Alert variant="error">{error}</Alert>}

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={handleEmailChange}
        placeholder="you@gmail.com"
        autoComplete="email"
        error={fieldErrors.email}
        required
      />

      <Input
        label="Password"
        type="password"
        value={password}
        onChange={handlePasswordChange}
        placeholder="Min. 8 characters"
        autoComplete="new-password"
        error={fieldErrors.password}
        required
      />

      <Input
        label="Confirm Password"
        type="password"
        value={confirmPassword}
        onChange={handleConfirmPasswordChange}
        placeholder="Re-enter your password"
        autoComplete="new-password"
        error={fieldErrors.confirmPassword}
        required
      />

      <Button type="submit" disabled={loading}>
        {loading ? "Creating account..." : "Create account"}
      </Button>

      <p className={styles.footer}>
        Already have an account?{" "}
        <Link href="/auth?mode=login">Sign in</Link>
      </p>
    </form>
  );
}
