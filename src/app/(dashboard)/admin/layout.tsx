import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { IconBuildingCommunity, IconChartBar } from "@tabler/icons-react";
import { AdminUserLink } from "@/components/admin/AdminUserLink";
import { SessionHydrator } from "@/components/SessionHydrator";
import { getSessionFromCookie, AUTH_COOKIE_NAME } from "@/lib/auth";
import { AdminLogoutButton } from "./AdminLogoutButton";
import { AdminNav } from "./AdminNav";

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
  const avatarUrl: string | null = session.avatar_url ?? null;

  return (
    <>
      <SessionHydrator initialToken={apiToken} />
      <aside id="sidebar">
        <div className="sb-logo">
          <div className="sb-logo-mark">
            <IconBuildingCommunity size={22} stroke={1.8} />
          </div>
          <h1>ركاز</h1>
          <p>لوحة مدير النظام</p>
        </div>

        <nav className="sb-nav">
          <div className="sb-section">الإدارة</div>
          <AdminNav />
        </nav>

        <div className="sb-footer">
          <AdminLogoutButton />
        </div>
      </aside>

      <main id="main">
        <header id="topbar">
          <div className="tb-title">
            <IconChartBar size={20} stroke={1.8} />
            <span>ركاز — إدارة المشتركين</span>
          </div>
          <div className="tb-actions">
            <AdminUserLink
              name={session.name}
              username={session.username}
              avatarUrl={avatarUrl}
            />
          </div>
        </header>
        <div id="content">{children}</div>
      </main>
    </>
  );
}
