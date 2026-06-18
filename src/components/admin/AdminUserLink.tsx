import Link from "next/link";
import { resolveMediaUrl } from "@/lib/media-url";

interface AdminUserLinkProps {
  name: string;
  username: string;
  avatarUrl?: string | null;
}

export function AdminUserLink({
  name,
  username,
  avatarUrl,
}: AdminUserLinkProps) {
  const initial = (name || username).charAt(0);
  const avatarSrc = resolveMediaUrl(avatarUrl);

  return (
    <Link href="/admin/profile" className="tb-user" title="الملف الشخصي">
      <div className="tb-avatar" style={{ overflow: "hidden" }}>
        {avatarSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarSrc}
            alt={name || username}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          initial
        )}
      </div>
      <div className="tb-user-info">
        <div className="tb-user-name">{name || username}</div>
        <div className="tb-user-role">مدير النظام</div>
      </div>
    </Link>
  );
}
