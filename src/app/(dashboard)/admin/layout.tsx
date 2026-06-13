import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AdminLayoutShell } from "@/components/admin/AdminLayoutShell";
import { SessionHydrator } from "@/components/SessionHydrator";
import { getSessionFromCookie, AUTH_COOKIE_NAME } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionFromCookie();
  if (!session || session.role !== "admin") {
    redirect("/");
  }

  const cookieStore = await cookies();
  const apiToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  return (
    <>
      <SessionHydrator initialToken={apiToken} />
      <AdminLayoutShell session={session}>{children}</AdminLayoutShell>
    </>
  );
}
