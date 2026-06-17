import { redirect } from "next/navigation";
import { AdminLayoutShell } from "@/components/admin/AdminLayoutShell";
import { getSessionFromCookie } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionFromCookie();
  if (!session || session.role !== "admin") {
    redirect("/");
  }

  return <AdminLayoutShell session={session}>{children}</AdminLayoutShell>;
}
