"use client";

import React, { useState } from "react";

const btnStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 24px",
  background: "var(--color-primary)",
  color: "var(--color-on-primary)",
  border: "none",
  borderRadius: "8px",
  fontSize: "var(--typo-label-large-font-size)",
  fontWeight: 500,
  cursor: "pointer",
};

const textStyle: React.CSSProperties = {
  fontSize: "var(--typo-body-small-font-size)",
  color: "var(--color-on-surface-variant)",
  margin: 0,
};

export function ResendVerificationButton({ email }: { email: string }) {
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleClick() {
    setSending(true);
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      // Swallow — API always returns 200
    } finally {
      setSending(false);
      setDone(true);
    }
  }

  if (done) {
    return <p style={textStyle}>Verification email sent. Please check your inbox.</p>;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={sending}
      style={btnStyle}
    >
      {sending ? "Sending..." : "Resend verification email"}
    </button>
  );
}
