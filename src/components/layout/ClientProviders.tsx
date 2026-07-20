"use client";

import { FavoritesProvider } from "@/hooks/useFavorites";
import { NetworkStatusBanner } from "@/components/layout/NetworkStatusBanner";
import { AnalyticsScripts } from "@/components/analytics/AnalyticsScripts";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <FavoritesProvider>
      <AnalyticsScripts />
      <NetworkStatusBanner />
      {children}
    </FavoritesProvider>
  );
}
