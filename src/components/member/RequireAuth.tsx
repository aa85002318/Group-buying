"use client";

import { useRequireAuth } from "@/hooks/useRequireAuth";

type RequireAuthProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

/** Redirect unauthenticated users to login with safe return path */
export function RequireAuth({ children, fallback }: RequireAuthProps) {
  const { ready, authenticated } = useRequireAuth();

  if (!ready) {
    return fallback ?? <p className="py-12 text-center text-foreground-secondary">載入中…</p>;
  }

  if (!authenticated) return null;

  return <>{children}</>;
}
