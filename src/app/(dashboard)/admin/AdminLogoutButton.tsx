"use client";

import { useRouter } from "next/navigation";
import { IconLogout } from "@tabler/icons-react";
import { apiFetch } from "@/lib/api-client";
import { clearSessionCookie } from "@/lib/session-bridge";

export function AdminLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await apiFetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    await clearSessionCookie();
    router.push("/");
    router.refresh();
  }
  return (
    <button
      type="button"
      className="sb-item"
      onClick={handleLogout}
      style={{ width: "100%", marginTop: 4 }}
    >
      <IconLogout size={18} stroke={1.8} />
      تسجيل الخروج
    </button>
  );
}
