"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/config";
import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";
import { APP_ROUTES } from "@/lib/site-links";

export function useRequireAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setAuthenticated(true);
      setReady(true);
      return;
    }

    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) {
          setAuthenticated(true);
        } else {
          const next = getSafeRedirectPath(pathname, APP_ROUTES.profile);
          router.replace(`${APP_ROUTES.login}?next=${encodeURIComponent(next)}`);
        }
      })
      .catch(() => {
        router.replace(APP_ROUTES.login);
      })
      .finally(() => setReady(true));
  }, [pathname, router]);

  return { ready, authenticated };
}
