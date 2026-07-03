"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { navForRole, type AdminNavItem } from "@/lib/admin/permissions";

type AdminProfile = { full_name?: string; role?: string } | null;

type AdminShellContextValue = {
  profile: AdminProfile;
  nav: AdminNavItem[];
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
};

const AdminShellContext = createContext<AdminShellContextValue | null>(null);

export function useAdminShell() {
  const ctx = useContext(AdminShellContext);
  if (!ctx) throw new Error("useAdminShell must be used within AdminShell");
  return ctx;
}

export function AdminShell({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<AdminProfile>(null);
  const [nav, setNav] = useState<AdminNavItem[]>(navForRole("admin"));
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) {
          setProfile(d.profile);
          if (d.profile.role) setNav(navForRole(d.profile.role));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  return (
    <AdminShellContext.Provider value={{ profile, nav, mobileNavOpen, setMobileNavOpen }}>
      {children}
    </AdminShellContext.Provider>
  );
}
