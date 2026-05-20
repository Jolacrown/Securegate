import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard — SecureGate",
  description: "Your SecureGate dashboard.",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/auth");
  }

  // Ensure role is a string
  const user = {
    id: session.user.id,
    email: session.user.email || "",
    role: session.user.role || "USER",
  };

  return <DashboardClient user={user} expires={session.expires} />;
}
