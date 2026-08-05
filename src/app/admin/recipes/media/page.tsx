"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { Recipe } from "@/lib/types/database";

type MediaRow = {
  id: string;
  media_type: string;
  url: string;
  thumbnail_url?: string | null;
  alt_text?: string | null;
  is_active?: boolean;
};

type RecipeWithMedia = Recipe & { media?: MediaRow[] };

export default function AdminRecipeMediaLibraryPage() {
  const [rows, setRows] = useState<RecipeWithMedia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const listRes = await fetch("/api/admin/recipes");
        const listData = await listRes.json();
        const recipes = (listData.recipes ?? []) as Recipe[];
        const withMedia = await Promise.all(
          recipes.slice(0, 40).map(async (r) => {
            const res = await fetch(`/api/admin/recipes/${r.id}/media`);
            const data = await res.json().catch(() => ({}));
            return { ...r, media: (data.media ?? []) as MediaRow[] };
          })
        );
        setRows(withMedia.filter((r) => (r.media?.length ?? 0) > 0 || r.cover_image));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="食譜素材庫"
        description="依食譜彙整封面與 recipe_media。上傳與裁切仍在各食譜編輯器內完成。"
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">載入中…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">尚無素材</p>
      ) : (
        <div className="space-y-4">
          {rows.map((r) => (
            <div key={r.id} className="rounded-xl bg-white p-4 shadow-card">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{r.title}</p>
                  <p className="font-mono text-xs text-muted-foreground">{r.slug}</p>
                </div>
                <Link href={`/admin/recipes/${r.id}`}>
                  <Button size="sm" variant="outline">
                    編輯
                  </Button>
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {r.cover_image ? (
                  <div className="relative h-20 w-20 overflow-hidden rounded-md bg-muted">
                    <Image src={r.cover_image} alt="封面" fill className="object-cover" sizes="80px" />
                    <span className="absolute bottom-0 inset-x-0 bg-black/50 px-1 text-[10px] text-white">
                      封面
                    </span>
                  </div>
                ) : null}
                {(r.media ?? []).slice(0, 12).map((m) => (
                  <div key={m.id} className="relative h-20 w-20 overflow-hidden rounded-md bg-muted">
                    {m.media_type === "video" ? (
                      <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                        影片
                      </div>
                    ) : (
                      <Image
                        src={m.thumbnail_url || m.url}
                        alt={m.alt_text ?? ""}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
