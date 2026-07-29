"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Gift, UserRound } from "lucide-react";
import { SectionHeader } from "@/components/consumer/SectionHeader";
import { HorizontalScroller } from "@/components/home/HorizontalScroller";
import { CategoryLucideIcon } from "@/components/home/TrustServicesSection";
import { parseStoreNewsCards, type StoreNewsCard } from "@/lib/home/store-news";
import { cn } from "@/lib/utils";

const CARD_ICONS = {
  Gift,
  UserRound,
};

type MemberState = "guest" | "logged_in" | "bound";

function resolveMemberCta(state: MemberState, card: StoreNewsCard) {
  if (card.cardType !== "store_member") {
    return { label: card.buttonText, href: card.buttonHref };
  }
  if (state === "guest") {
    return { label: "登入／註冊", href: "/member" };
  }
  if (state === "bound") {
    return { label: "查看會員權益", href: "/member" };
  }
  return { label: "綁定門市會員", href: "/member?bind=store" };
}

function StoreNewsCardView({
  card,
  memberState,
}: {
  card: StoreNewsCard;
  memberState: MemberState;
}) {
  const cta = resolveMemberCta(memberState, card);
  const Icon = card.icon && card.icon in CARD_ICONS ? CARD_ICONS[card.icon as keyof typeof CARD_ICONS] : null;
  const imageUrl = card.mobileImageUrl || card.desktopImageUrl;

  return (
    <article
      className={cn(
        "flex w-[82vw] max-w-[340px] shrink-0 flex-col overflow-hidden rounded-[var(--brand-card-radius)] border border-[var(--brand-border)] bg-[var(--brand-surface)] shadow-[var(--shadow-sm)] md:w-auto md:max-w-none md:flex-1"
      )}
      style={{ backgroundColor: card.backgroundColor ?? undefined }}
    >
      {imageUrl ? (
        <div className="relative aspect-[16/9] bg-[var(--brand-surface-muted)]">
          <Image src={imageUrl} alt={card.title} fill className="object-cover" unoptimized />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start gap-3">
          {Icon ? (
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]">
              <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </span>
          ) : card.icon ? (
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]">
              <CategoryLucideIcon name={card.icon} className="h-5 w-5" />
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-[var(--brand-text-primary)]">{card.title}</h3>
            {card.subtitle ? (
              <p className="mt-1 text-sm leading-relaxed text-[var(--brand-text-secondary)]">
                {card.subtitle}
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-auto flex justify-end">
          <Link
            href={cta.href}
            className="brand-focus-ring text-sm font-bold text-[var(--brand-primary)] hover:underline"
          >
            {cta.label} →
          </Link>
        </div>
      </div>
    </article>
  );
}

export function HomeStoreNews({
  title = "門市最新資訊",
  subtitle,
  viewAllHref = "/member",
  viewAllLabel = "查看全部",
  config,
  limit = 2,
}: {
  title?: string;
  subtitle?: string | null;
  viewAllHref?: string | null;
  viewAllLabel?: string;
  config?: Record<string, unknown> | null;
  limit?: number;
}) {
  const [memberState, setMemberState] = useState<MemberState>("guest");
  const cards = parseStoreNewsCards(config).slice(0, limit);

  useEffect(() => {
    fetch("/api/profile", { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) {
          setMemberState("guest");
          return;
        }
        const d = await r.json();
        const profile = d.profile;
        if (profile?.member_number || profile?.member_code) {
          setMemberState("bound");
        } else {
          setMemberState("logged_in");
        }
      })
      .catch(() => setMemberState("guest"));
  }, []);

  if (!cards.length) return null;

  return (
    <section aria-label={title} className="space-y-3">
      <SectionHeader
        title={title}
        href={viewAllHref ?? undefined}
        linkLabel={viewAllLabel}
        className="!mb-0"
      />
      {subtitle ? <p className="text-xs text-[var(--brand-text-secondary)]">{subtitle}</p> : null}
      <HorizontalScroller className="gap-3 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible">
        {cards.map((card) => (
          <StoreNewsCardView key={card.id} card={card} memberState={memberState} />
        ))}
      </HorizontalScroller>
    </section>
  );
}
