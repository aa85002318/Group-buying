"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/consumer/SectionHeader";
import { formatDate } from "@/lib/utils";
import { getMockGroupBuyEventsWithProducts } from "@/lib/mock-data";
import type { GroupBuyEvent } from "@/lib/types/database";

type EventRow = GroupBuyEvent & {
  group_buy_products?: unknown[] | null;
  is_featured?: boolean | null;
};

function EventCard({ event }: { event: EventRow }) {
  const active = event.status === "active";
  const count = Array.isArray(event.group_buy_products) ? event.group_buy_products.length : 0;
  return (
    <Link href={`/group-buy/${event.id}`} className="block">
      <Card className="overflow-hidden border-border bg-surface shadow-card">
        {event.banner_url && (
          <div className="relative h-36 w-full overflow-hidden bg-groupBuy-soft">
            <Image
              src={event.banner_url}
              alt={event.title}
              fill
              className="object-cover"
              sizes="(max-width:768px) 100vw, 480px"
              unoptimized
            />
          </div>
        )}
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h2 className="min-w-0 flex-1 font-bold text-foreground">{event.title}</h2>
            <Badge className={active ? "bg-groupBuy text-white" : "bg-disabled text-white"}>
              {active ? "進行中" : event.status === "ended" ? "已結束" : event.status}
            </Badge>
          </div>
          {event.description && (
            <p className="mt-1 line-clamp-2 text-sm text-foreground-secondary">{event.description}</p>
          )}
          <p className="mt-2 text-xs text-foreground-muted">
            {formatDate(event.start_at)} — {formatDate(event.end_at)}
          </p>
          <p className="mt-1 text-sm font-semibold text-groupBuy">{count} 項商品</p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function GroupBuyPage() {
  const [events, setEvents] = useState<EventRow[]>(
    getMockGroupBuyEventsWithProducts() as unknown as EventRow[]
  );

  useEffect(() => {
    fetch("/api/group-buy-events")
      .then((r) => r.json())
      .then((d) => d.events?.length && setEvents(d.events))
      .catch(() => {});
  }, []);

  const active = useMemo(() => events.filter((e) => e.status === "active"), [events]);
  const featured = useMemo(
    () => active.filter((e) => e.is_featured).slice(0, 6),
    [active]
  );
  const closingSoon = useMemo(() => {
    return [...active]
      .sort((a, b) => new Date(a.end_at).getTime() - new Date(b.end_at).getTime())
      .slice(0, 6);
  }, [active]);
  const ended = useMemo(() => events.filter((e) => e.status === "ended").slice(0, 4), [events]);

  return (
    <div className="space-y-8 page-enter">
      <header>
        <p className="text-xs font-bold text-groupBuy">團購專區</p>
        <h1 className="mt-1 text-2xl font-black text-foreground">限時開團與熱門商品</h1>
        <p className="mt-1 text-sm text-foreground-secondary">
          保留既有團購商品、購物車、收單與庫存邏輯。
        </p>
      </header>

      <section className="space-y-3">
        <SectionHeader title="今日開團" accentClass="bg-groupBuy" />
        {active.length === 0 ? (
          <p className="rounded-card bg-groupBuy-soft p-4 text-sm text-foreground-secondary">
            目前沒有進行中的團購。
          </p>
        ) : (
          <div className="space-y-3">
            {active.slice(0, 4).map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <SectionHeader title="即將收單" href="/group-buy" accentClass="bg-groupBuy" />
        <div className="space-y-3">
          {closingSoon.map((e) => (
            <EventCard key={`soon-${e.id}`} event={e} />
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="space-y-3">
          <SectionHeader title="本週精選／熱門團購" accentClass="bg-groupBuy" />
          <div className="space-y-3">
            {featured.map((e) => (
              <EventCard key={`feat-${e.id}`} event={e} />
            ))}
          </div>
        </section>
      )}

      <section className="rounded-card border border-dashed border-border bg-surface-soft p-4 text-sm text-foreground-secondary">
        直播限定團購入口可至{" "}
        <Link href="/live" className="font-semibold text-primary">
          直播專區
        </Link>{" "}
        查看。
      </section>

      {ended.length > 0 && (
        <section className="space-y-3">
          <SectionHeader title="已結束團購" />
          <div className="space-y-3 opacity-80">
            {ended.map((e) => (
              <EventCard key={`end-${e.id}`} event={e} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
