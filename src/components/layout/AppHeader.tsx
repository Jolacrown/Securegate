"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button/Button";
import styles from "./AppHeader.module.css";

export function AppHeader() {
  const { data: session } = useSession();

  return (
    <header className={styles.header}>
      <span className={styles.brand}>🔐 SecureGate</span>
      <div className={styles.actions}>
        {session?.user && (
          <div className={styles.userInfo}>
            <span className={styles.email}>{session.user.email}</span>
            <span className={styles.roleBadge}>{session.user.role}</span>
          </div>
        )}
        <Button
          variant="ghost"
          className={styles.logoutBtn}
          onClick={() => signOut({ callbackUrl: "/auth" })}
        >
          Logout
        </Button>
      </div>
    </header>
  );
}
