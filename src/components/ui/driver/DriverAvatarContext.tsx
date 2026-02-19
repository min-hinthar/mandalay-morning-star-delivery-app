/**
 * DriverAvatarContext - Provides driver avatar data to child components
 *
 * Used by DriverHeader to display avatar without prop drilling through layout.
 * Set in the driver layout, consumed by any page-level DriverHeader.
 */

"use client";

import { createContext, useContext } from "react";

interface DriverAvatarData {
  avatarUrl: string | null;
  driverName: string | null;
}

const DriverAvatarContext = createContext<DriverAvatarData>({
  avatarUrl: null,
  driverName: null,
});

export function DriverAvatarProvider({
  avatarUrl,
  driverName,
  children,
}: DriverAvatarData & { children: React.ReactNode }) {
  return (
    <DriverAvatarContext.Provider value={{ avatarUrl, driverName }}>
      {children}
    </DriverAvatarContext.Provider>
  );
}

export function useDriverAvatar(): DriverAvatarData {
  return useContext(DriverAvatarContext);
}
