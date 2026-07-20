"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Announcement = {
  id: string;
  title: string;
  body: string;
  store_id: string | null;
};

export function StoreAnnouncementsSection() {
  const [items, setItems] = useState<Announcement[]>([]);

  useEffect(() => {
    fetch("/api/cms")
      .then((r) => r.json())
      .then((d) => setItems(d.announcements ?? []))
      .catch(() => {});
  }, []);

  if (!items.length) return null;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-7 w-1.5 rounded-full bg-[#FF8A3D]" />
          <h2 className="section-title">門市公告</h2>
        </div>
        <Link href="/stores" className="text-sm font-bold text-primary">
          門市資訊
        </Link>
      </div>
      <div className="space-y-3">
        {items.slice(0, 3).map((a) => (
          <article
            key={a.id}
            className="rounded-[18px] border border-[#FFE4CC] bg-[#FFF8F1] px-4 py-3"
          >
            <h3 className="font-bold text-[#1E3A8A]">{a.title}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-[#64748B]">{a.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
