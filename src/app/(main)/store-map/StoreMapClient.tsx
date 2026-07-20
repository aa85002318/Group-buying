"use client";

import { useMemo, useState } from "react";
import { HomeSearchBar } from "@/components/consumer/HomeSearchBar";
import { StoreLocationResult } from "@/components/consumer/StoreLocationResult";
import { SectionHeader } from "@/components/consumer/SectionHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { STORE_ZONES, searchProductLocations } from "@/lib/mock/consumer-hub";

export function StoreMapClient() {
  const [q, setQ] = useState("");
  const [submitted, setSubmitted] = useState("");
  const results = useMemo(
    () => (submitted ? searchProductLocations(submitted) : []),
    [submitted]
  );

  return (
    <div className="space-y-8 page-enter">
      <header className="space-y-3">
        <h1 className="text-2xl font-black text-foreground">門市商品地圖</h1>
        <p className="text-sm text-foreground-secondary">
          第一階段提供文字位置查詢與簡易分區圖。不做即時定位、Beacon 或 AR。
        </p>
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(q.trim());
          }}
        >
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜尋商品名稱、SKU 或條碼"
            aria-label="搜尋門市商品位置"
          />
          <Button type="submit" className="sm:w-auto">
            查詢位置
          </Button>
        </form>
      </header>

      <section>
        <SectionHeader title="門市平面分區" accentClass="bg-success" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {STORE_ZONES.map((z) => (
            <div key={z.code} className="rounded-[16px] border border-border bg-success-soft p-3">
              <p className="text-xs font-bold text-success">{z.code}</p>
              <p className="text-sm font-black text-foreground">{z.name}</p>
              {z.hint && (
                <p className="mt-1 text-[11px] text-foreground-secondary">{z.hint}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader title="查詢結果" accentClass="bg-info" />
        {!submitted && (
          <p className="text-sm text-foreground-secondary">輸入關鍵字後顯示區域／貨架／層架。</p>
        )}
        {submitted && results.length === 0 && (
          <div className="card-surface p-6 text-center">
            <p className="font-bold text-foreground">找不到「{submitted}」的位置資料</p>
            <p className="mt-1 text-sm text-foreground-secondary">
              可改搜「麵粉」「奶油」「巧克力」試試 mock 資料。
            </p>
          </div>
        )}
        {results.map((item) => (
          <StoreLocationResult key={item.productId} item={item} />
        ))}
      </section>

      <p className="text-xs text-foreground-secondary">
        全站搜尋也可導向此功能：{" "}
        <span className="font-mono">/search?q=</span>
      </p>
      <HomeSearchBar placeholder="回全站搜尋…" />
    </div>
  );
}
