import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth");
  }

  if (!session.user.emailVerified) {
    const url = new URL("/auth", "http://n");
    url.searchParams.set("mode", "verify-pending");
    url.searchParams.set("email", session.user.email || "");
    redirect(url.pathname + url.search);
  }

  return (
    <>
      <AppHeader />
      <main>{children}</main>
    </>
  );
}
