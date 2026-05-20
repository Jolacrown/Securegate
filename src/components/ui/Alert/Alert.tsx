import React from "react";
import styles from "./Alert.module.css";

interface AlertProps {
  variant: "error" | "success" | "info";
  children: React.ReactNode;
}

export function Alert({ variant, children }: AlertProps) {
  return (
    <div className={`${styles.alert} ${styles[variant]}`} role="alert">
      {children}
    </div>
  );
}
