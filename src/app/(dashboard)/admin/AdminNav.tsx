"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconLayoutDashboard,
  IconPalette,
  IconUserCircle,
  IconUsers,
  type TablerIcon,
} from "@tabler/icons-react";

const navItems: { href: string; label: string; icon: TablerIcon }[] = [
  { href: "/admin", label: "لوحة التحكم", icon: IconLayoutDashboard },
  { href: "/admin/subscribers", label: "إدارة المشتركين", icon: IconUsers },
  { href: "/admin/theme", label: "ألوان النظام", icon: IconPalette },
  { href: "/admin/profile", label: "الملف الشخصي", icon: IconUserCircle },
];

interface AdminNavProps {
  onNavigate?: () => void;
}

export function AdminNav({ onNavigate }: AdminNavProps) {
  const pathname = usePathname();

  return (
    <>
      {navItems.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`sb-item${active ? " active" : ""}`}
            onClick={onNavigate}
          >
            <item.icon size={18} stroke={1.8} />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
