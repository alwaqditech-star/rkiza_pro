"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  IconBuildingCommunity,
  IconChartBar,
  IconMenu2,
} from "@tabler/icons-react";
import { AdminUserLink } from "@/components/admin/AdminUserLink";
import type { AdminSession } from "@/lib/types";
import { AdminLogoutButton } from "@/app/(dashboard)/admin/AdminLogoutButton";
import { AdminNav } from "@/app/(dashboard)/admin/AdminNav";

const PAGE_TITLES: Record<string, string> = {
  "/admin": "لوحة التحكم",
  "/admin/subscribers": "إدارة المشتركين",
  "/admin/theme": "ألوان النظام",
  "/admin/profile": "الملف الشخصي",
};

interface AdminLayoutShellProps {
  session: AdminSession;
  children: React.ReactNode;
}

export function AdminLayoutShell({ session, children }: AdminLayoutShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pageTitle =
    PAGE_TITLES[pathname] ??
    (pathname.startsWith("/admin/subscribers")
      ? "إدارة المشتركين"
      : "ركاز — إدارة المشتركين");

  function closeSidebar() {
    setSidebarOpen(false);
  }

  return (
    <>
      <aside id="sidebar" className={sidebarOpen ? "open" : undefined}>
        <div className="sb-logo">
          <div className="sb-logo-mark">
            <IconBuildingCommunity size={22} stroke={1.8} />
          </div>
          <h1>ركاز</h1>
          <p>لوحة مدير النظام</p>
        </div>

        <nav className="sb-nav">
          <div className="sb-section">الإدارة</div>
          <AdminNav onNavigate={closeSidebar} />
        </nav>

        <div className="sb-footer">
          <AdminLogoutButton />
        </div>
      </aside>

      <div
        id="sidebar-overlay"
        className={sidebarOpen ? "open" : undefined}
        onClick={closeSidebar}
        onKeyDown={(e) => e.key === "Escape" && closeSidebar()}
        role="presentation"
      />

      <main id="main">
        <header id="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              id="menu-btn"
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="القائمة"
            >
              <IconMenu2 size={22} stroke={1.8} />
            </button>
            <div className="tb-title">
              <IconChartBar size={20} stroke={1.8} />
              <span>{pageTitle}</span>
            </div>
          </div>
          <div className="tb-actions">
            <AdminUserLink
              name={session.name}
              username={session.username}
              avatarUrl={session.avatar_url ?? null}
            />
          </div>
        </header>
        <div id="content">{children}</div>
      </main>
    </>
  );
}
