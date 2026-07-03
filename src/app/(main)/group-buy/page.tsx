"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { getMockGroupBuyEventsWithProducts } from "@/lib/mock-data";
import type { GroupBuyEvent } from "@/lib/types/database";

export default function GroupBuyPage() {
  const [events, setEvents] = useState(getMockGroupBuyEventsWithProducts());

  useEffect(() => {
    fetch("/api/group-buy-events")
      .then((r) => r.json())
      .then((d) => d.events?.length && setEvents(d.events))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-coffee">團購專區</h1>
      {events.map((event: GroupBuyEvent & { group_buy_products?: unknown[] }) => (
        <Link key={event.id} href={`/group-buy/${event.id}`}>
          <Card className="overflow-hidden">
            {event.banner_url && (
              <div className="relative h-40 w-full overflow-hidden">
                <Image src={event.banner_url} alt={event.title} fill className="object-cover" sizes="100vw" unoptimized />
              </div>
            )}
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-bold">{event.title}</h2>
                <Badge variant="success">進行中</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{event.description}</p>
              <p className="mt-2 text-xs text-coffee">
                {formatDate(event.start_at)} — {formatDate(event.end_at)}
              </p>
              <p className="mt-1 text-sm text-primary">
                {(event as { group_buy_products?: { length: number } }).group_buy_products?.length ?? 0} 項商品
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
