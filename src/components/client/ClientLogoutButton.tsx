"use client";
import { apiFetch } from "@/lib/api-client";
import { clearSessionCookie } from "@/lib/session-bridge";

import { useRouter } from "next/navigation";
import { IconLogout } from "@tabler/icons-react";

export function ClientLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await apiFetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    await clearSessionCookie();
    router.push("/");
    router.refresh();
  }

  return (
    <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>
      <IconLogout size={16} stroke={1.8} />
      خروج
    </button>
  );
}
