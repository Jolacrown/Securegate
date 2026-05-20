import Link from "next/link";
import { Button } from "@/components/ui/Button/Button";
import type { Metadata } from "next";
import styles from "./denied.module.css";

export const metadata: Metadata = {
  title: "403 — Access Denied",
  description: "You do not have permission to access this page.",
};

export default function AccessDeniedPage() {
  return (
    <div className={styles.page}>
      <div className={styles.icon}>🛡️</div>
      <div className={styles.code}>403</div>
      <h1 className={styles.title}>Access Denied</h1>
      <p className={styles.description}>
        You do not have the required permissions to access this page. If you
        believe this is a mistake, please contact your administrator.
      </p>
      <div className={styles.actions}>
        <Link href="/dashboard">
          <Button variant="primary">Go to Dashboard</Button>
        </Link>
        <Link href="/auth">
          <Button variant="ghost">Sign in</Button>
        </Link>
      </div>
    </div>
  );
}
