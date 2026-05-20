import React from "react";
import Link from "next/link";
import styles from "./AuthLayout.module.css";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className={styles.layout}>
      <Link href="/auth?mode=register" className={styles.branding}>
        <span className={styles.logo}>🔐 SecureGate</span>
        <span className={styles.subtitle}>Authentication &amp; IAM</span>
      </Link>
      {children}
    </div>
  );
}
