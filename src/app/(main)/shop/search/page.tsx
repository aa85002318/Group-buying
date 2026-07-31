"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShopSearchBar } from "@/components/shop/ShopSearchBar";

function ShopSearchInner() {
  const sp = useSearchParams();
  const q = (sp.get("q") ?? "").trim();

  const catalogHref = useMemo(() => {
    if (!q) return "/baking-materials";
    return `/baking-materials?q=${encodeURIComponent(q)}`;
  }, [q]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 px-4 py-4 md:px-6">
      <ShopSearchBar />
      <div className="rounded-[20px] border border-[#EAEAEA] bg-[#FFFEFA] p-5">
        <h1 className="text-xl font-bold text-[#153E73]">
          {q ? `搜尋「${q}」` : "商城搜尋"}
        </h1>
        <p className="mt-2 text-sm text-[#687386]">
          目前以烘焙材料目錄顯示搜尋結果。
        </p>
        <Link
          href={catalogHref}
          className="mt-4 inline-flex h-11 items-center rounded-full bg-[#153E73] px-4 text-sm font-bold text-white"
        >
          查看搜尋結果
        </Link>
        <Link
          href="/shop"
          className="mt-3 ml-3 inline-flex h-11 items-center text-sm font-semibold text-[#153E73]"
        >
          返回商城
        </Link>
      </div>
    </div>
  );
}

export default function ShopSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-8 text-sm text-[#687386]">載入搜尋…</div>
      }
    >
      <ShopSearchInner />
    </Suspense>
  );
}
