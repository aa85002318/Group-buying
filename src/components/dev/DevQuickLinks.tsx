"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { getAppEnv } from "@/lib/env";
import { getSiteLinks } from "@/lib/site-links";

export function DevQuickLinks() {
  if (getAppEnv() !== "development") return null;

  const links = getSiteLinks();

  return (
    <Card className="border-dashed border-primary/40 bg-primary/5">
      <CardContent className="space-y-3 p-4">
        <div>
          <p className="text-sm font-medium text-coffee">開發連線捷徑</p>
          <p className="text-xs text-muted-foreground">本機 LAN 測試用，正式環境不顯示</p>
        </div>
        <ul className="space-y-2">
          {links.map((item) => (
            <li key={item.key} className="rounded-lg bg-white px-3 py-2 text-sm shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <Link href={item.href} className="font-medium text-primary hover:underline">
                  {item.label}
                </Link>
                <span className="text-xs text-muted-foreground">{item.description}</span>
              </div>
              <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">{item.absoluteUrl}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
