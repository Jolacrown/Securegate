import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import styles from "../dashboard/dashboard.module.css";

export const metadata: Metadata = {
  title: "Settings — SecureGate",
  description: "Your account settings.",
};

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth");
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Settings</h1>
      <div className={styles.infoCard}>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Email</span>
          <span className={styles.infoValue}>{session.user.email}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Role</span>
          <span className={styles.roleBadge}>{session.user.role}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Account</span>
          <span className={styles.infoValue}>Active</span>
        </div>
      </div>
    </div>
  );
}
