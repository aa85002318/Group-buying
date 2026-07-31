"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Headphones, ShieldCheck, Store, Truck } from "lucide-react";
import type { HomepageBlock } from "@/lib/types/database";
import { resolveHomeBlock } from "@/lib/home/blocks";
import {
  DEFAULT_SERVICE_SHORTCUTS,
  parseServiceShortcuts,
  type ServiceShortcutItem,
} from "@/lib/home/service-shortcuts";

const ICON_MAP = {
  ShieldCheck,
  Truck,
  Store,
  Headphones,
};

/**
 * Homepage bottom — fixed 1:1 shortcut buttons with illustration safe area.
 * Button size never changes when CMS swaps images (always object-fit: contain).
 */
export function HomeServiceShortcutsSection() {
  const [items, setItems] = useState<ServiceShortcutItem[]>(DEFAULT_SERVICE_SHORTCUTS);
  const [title, setTitle] = useState("快捷服務入口");
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/cms", { credentials: "include" });
        const json = await res.json().catch(() => ({}));
        if (cancelled || !res.ok) return;
        const blocks = (json.blocks ?? []) as HomepageBlock[];
        const block = resolveHomeBlock(blocks, "service_shortcuts");
        const row = blocks.find((b) => b.block_key === "service_shortcuts");
        setVisible(row ? row.is_visible !== false : true);
        setTitle(block.title || "快捷服務入口");
        setItems(parseServiceShortcuts(block.config));
      } catch {
        // keep defaults
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!visible || items.length === 0) return null;

  return (
    <section
      className="service-shortcut-section bg-[#FFFEFA] px-[15px] pt-[15px] pb-8 md:pb-10"
      aria-label={title}
    >
      <div className="mx-auto w-full max-w-[1440px] xl:max-w-[1320px]">
        <header className="mb-3.5 flex items-start gap-2 md:mb-[18px]">
          <span
            className="mt-[5px] h-7 w-1.5 shrink-0 rounded-full bg-[#FFD454]"
            aria-hidden
          />
          <h2 className="text-[22px] font-bold leading-[1.25] text-[#153E73] md:text-[28px]">
            {title}
          </h2>
        </header>

        <ul className="service-shortcut-grid mx-auto grid max-w-[720px] grid-cols-4 gap-2.5 sm:gap-3 md:gap-4">
          {items.slice(0, 4).map((item) => (
            <li key={item.id} className="flex min-w-0 justify-center">
              <ServiceShortcutButton item={item} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ServiceShortcutButton({ item }: { item: ServiceShortcutItem }) {
  const Icon = ICON_MAP[item.icon as keyof typeof ICON_MAP] ?? ShieldCheck;
  const style = {
    backgroundColor: item.backgroundColor || "#FFFFFF",
  };
  /** Full-bleed art already includes title/subtitle — avoid visual double text. */
  const labelsInImage = item.labelsInImage !== false && Boolean(item.imageUrl);

  const body = (
    <>
      <span className="service-shortcut-safe" aria-hidden={labelsInImage}>
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt=""
            className="service-shortcut-img"
            draggable={false}
          />
        ) : (
          <Icon className="h-10 w-10 text-[#153E73] md:h-12 md:w-12" strokeWidth={1.5} />
        )}
      </span>
      {!labelsInImage ? (
        <span className="service-shortcut-copy">
          <span className="service-shortcut-title">{item.title}</span>
          {item.subtitle ? (
            <span className="service-shortcut-subtitle">{item.subtitle}</span>
          ) : null}
        </span>
      ) : (
        <span className="sr-only">
          {item.title}
          {item.subtitle ? `，${item.subtitle}` : ""}
        </span>
      )}
    </>
  );

  const className = labelsInImage
    ? "service-shortcut-btn service-shortcut-btn--art"
    : "service-shortcut-btn";

  if (item.href) {
    return (
      <Link
        href={item.href}
        className={className}
        style={style}
        aria-label={`${item.title}${item.subtitle ? `：${item.subtitle}` : ""}`}
      >
        {body}
      </Link>
    );
  }

  return (
    <div className={className} style={style} aria-label={item.title}>
      {body}
    </div>
  );
}
