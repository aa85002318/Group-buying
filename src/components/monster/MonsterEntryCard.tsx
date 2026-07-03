import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export function MonsterEntryCard() {
  return (
    <Card className="overflow-hidden border-[#F7DADA] bg-gradient-to-r from-[#FFF8F5] to-[#F7DADA]/40">
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#F7DADA] text-3xl">
          🍞👾
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-[#333333]">餵養麵包小怪獸</h2>
          <p className="text-sm text-[#8A8A8A]">
            分享購後心得，餵小怪獸吃麵包，解鎖專屬好禮！
          </p>
        </div>
        <Link
          href="/monster"
          className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary-dark"
        >
          開始餵食
        </Link>
      </CardContent>
    </Card>
  );
}
