"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Card } from "@/components/ui/Card/Card";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { VerifyPendingForm } from "@/components/auth/VerifyPendingForm";

function AuthContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "login";

  switch (mode) {
    case "register":
      return <RegisterForm />;
    case "forgot-password":
      return <ForgotPasswordForm />;
    case "reset-password":
      return <ResetPasswordForm />;
    case "verify-pending":
      return <VerifyPendingForm />;
    default:
      return <LoginForm />;
  }
}

export default function AuthPage() {
  return (
    <AuthLayout>
      <Card>
        <Suspense fallback={<div>Loading...</div>}>
          <AuthContent />
        </Suspense>
      </Card>
    </AuthLayout>
  );
}
