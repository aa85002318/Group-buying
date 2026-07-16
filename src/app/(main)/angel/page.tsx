import Link from "next/link";
import type { Metadata } from "next";
import { BRAND_NAME } from "@/lib/env";

export const metadata: Metadata = {
  title: `小天使餵養｜${BRAND_NAME}`,
};

export default function AngelPage() {
  return (
    <div className="mx-auto max-w-md space-y-5 py-4 text-center">
      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-brand-gradient text-4xl shadow-angel">
        👼
      </div>
      <div className="space-y-2">
        <h1 className="text-xl font-bold text-foreground">小天使餵養</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          分享團購、累積成長值，餵飽你的小天使就能解鎖獎勵。完整遊戲體驗即將在下一階段串接。
        </p>
      </div>
      <div className="card-surface space-y-3 p-5 text-left text-sm">
        <p className="font-medium text-foreground">目前成長值</p>
        <div className="h-3 overflow-hidden rounded-full bg-brand-blush">
          <div className="h-full w-[68%] rounded-full bg-brand-gradient" />
        </div>
        <p className="text-muted-foreground">680 / 1000</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Link href="/share-rewards" className="btn-brand">
          去分享
        </Link>
        <Link
          href="/monster"
          className="inline-flex items-center justify-center rounded-button border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-brand-blush focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          查看現有遊戲頁
        </Link>
      </div>
    </div>
  );
}
