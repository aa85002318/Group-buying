"use client";

import { FavoritesProvider } from "@/hooks/useFavorites";
import { NetworkStatusBanner } from "@/components/layout/NetworkStatusBanner";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <FavoritesProvider>
      <NetworkStatusBanner />
      {children}
    </FavoritesProvider>
  );
}
