import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSessionFromCookie, AUTH_COOKIE_NAME } from "@/lib/auth";
import { getClientPermissions } from "@/lib/client-permissions";
import { ClientLayoutShell } from "@/components/client/ClientLayoutShell";
import { SessionHydrator } from "@/components/SessionHydrator";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionFromCookie();
  if (!session || session.role !== "client") {
    redirect("/");
  }

  const cookieStore = await cookies();
  const apiToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const permissions = getClientPermissions(session);

  return (
    <>
      <SessionHydrator initialToken={apiToken} />
      <ClientLayoutShell session={session} permissions={permissions}>
        {children}
      </ClientLayoutShell>
    </>
  );
}
