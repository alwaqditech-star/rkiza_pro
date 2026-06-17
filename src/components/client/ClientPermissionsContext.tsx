"use client";

import { createContext, useContext } from "react";
import type { ClientPermissions } from "@/lib/client-permissions";

const ClientPermissionsContext = createContext<ClientPermissions | null>(null);

export function ClientPermissionsProvider({
  permissions,
  children,
}: {
  permissions: ClientPermissions;
  children: React.ReactNode;
}) {
  return (
    <ClientPermissionsContext.Provider value={permissions}>
      {children}
    </ClientPermissionsContext.Provider>
  );
}

export function useClientPermissions(): ClientPermissions {
  const value = useContext(ClientPermissionsContext);
  if (!value) {
    return {
      roleLabel: "—",
      canRead: false,
      canWrite: false,
      canDelete: false,
      canSettings: false,
    };
  }
  return value;
}
