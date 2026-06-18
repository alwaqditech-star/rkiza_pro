"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { IconMenu2 } from "@tabler/icons-react";
import { getClientPageIcon, getClientPageTitle } from "@/lib/client-nav";
import { resolveMediaUrl } from "@/lib/media-url";
import type { ClientSession } from "@/lib/types";
import { useClientPermissions } from "./ClientPermissionsContext";
import { ClientLogoutButton } from "./ClientLogoutButton";
import { ClientProfileModal } from "./ClientProfileModal";

interface ClientTopbarProps {
  session: ClientSession;
  onMenuClick: () => void;
}

export function ClientTopbar({ session, onMenuClick }: ClientTopbarProps) {
  const pathname = usePathname();
  const permissions = useClientPermissions();
  const title = getClientPageTitle(pathname);
  const PageIcon = getClientPageIcon(pathname);
  const [profileOpen, setProfileOpen] = useState(false);
  const displayName =
    session.display_name || session.association_name || session.username;
  const initial = displayName.charAt(0) || session.username.charAt(0);

  const avatarSrc = resolveMediaUrl(session.avatar_url);

  return (
    <>
      <header id="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            id="menu-btn"
            type="button"
            onClick={onMenuClick}
            aria-label="القائمة"
          >
            <IconMenu2 size={22} stroke={1.8} />
          </button>
          <div className="tb-title">
            <PageIcon size={20} stroke={1.8} />
            {title}
          </div>
        </div>
        <div className="tb-actions">
          <ClientLogoutButton />
          <button
            type="button"
            className="tb-user"
            onClick={() => setProfileOpen(true)}
            title="الملف الشخصي"
            style={{ border: "none", background: "none", cursor: "pointer" }}
          >
            <div
              className="tb-avatar"
              style={{ overflow: "hidden", padding: 0 }}
            >
              {avatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarSrc}
                  alt={session.association_name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                initial
              )}
            </div>
            <div className="tb-user-info">
              <div className="tb-user-name">{displayName}</div>
              <div className="tb-user-role">{permissions.roleLabel}</div>
            </div>
          </button>
        </div>
      </header>

      <ClientProfileModal
        open={profileOpen}
        session={session}
        onClose={() => setProfileOpen(false)}
      />
    </>
  );
}
