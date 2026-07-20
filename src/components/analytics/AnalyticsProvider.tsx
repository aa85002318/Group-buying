"use client";

import { AnalyticsScripts } from "@/components/analytics/AnalyticsScripts";

/** Client analytics bootstrap — uses NEXT_PUBLIC_* IDs when configured */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AnalyticsScripts />
      {children}
    </>
  );
}
