import { redirect } from "next/navigation";
import { getSessionFromCookie } from "@/lib/auth";
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

  const permissions = getClientPermissions(session);

  return (
    <>
      <SessionHydrator />
      <ClientLayoutShell session={session} permissions={permissions}>
        {children}
      </ClientLayoutShell>
    </>
  );
}
