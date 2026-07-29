"use client";

import Link from "next/link";
import { Headphones, ShieldCheck, Store, Truck } from "lucide-react";
import { BrandSection } from "@/components/brand/section/BrandSection";
import {
  parseServiceShortcuts,
  type ServiceShortcutItem,
} from "@/lib/home/service-shortcuts";
import { cn } from "@/lib/utils";

const ICON_MAP = {
  ShieldCheck,
  Truck,
  Store,
  Headphones,
};

export function HomeServiceShortcuts({
  title = "服務快捷入口",
  subtitle,
  config,
  limit = 4,
}: {
  title?: string;
  subtitle?: string | null;
  config?: Record<string, unknown> | null;
  limit?: number;
}) {
  const items = parseServiceShortcuts(config)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, limit);

  if (!items.length) return null;

  return (
    <BrandSection title={title} subtitle={subtitle ?? undefined}>
      <ul className="grid grid-cols-2 gap-3 min-[360px]:grid-cols-4 sm:grid-cols-4">
        {items.map((item) => (
          <ServiceShortcutTile key={item.id} item={item} />
        ))}
      </ul>
    </BrandSection>
  );
}

function ServiceShortcutTile({ item }: { item: ServiceShortcutItem }) {
  const Icon = ICON_MAP[item.icon as keyof typeof ICON_MAP] ?? ShieldCheck;
  const inner = (
    <>
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]">
        <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </span>
      <span className="text-sm font-bold text-[var(--brand-text-primary)]">{item.title}</span>
      {item.subtitle ? (
        <span className="line-clamp-2 text-[11px] leading-snug text-[var(--brand-text-secondary)]">
          {item.subtitle}
        </span>
      ) : null}
    </>
  );

  const className = cn(
    "flex flex-col items-center gap-2 rounded-[var(--brand-card-radius)] border border-[var(--brand-border)] bg-[var(--brand-surface)] px-2 py-4 text-center transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]"
  );

  if (item.href) {
    return (
      <li>
        <Link href={item.href} className={cn(className, "brand-focus-ring block")}>
          {inner}
        </Link>
      </li>
    );
  }

  return (
    <li className={className} aria-label={item.title}>
      {inner}
    </li>
  );
}
