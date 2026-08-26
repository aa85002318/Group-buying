"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function RecipeBreadcrumb({
  categoryName,
  title,
}: {
  categoryName?: string | null;
  title: string;
}) {
  return (
    <nav className="mb-5 flex flex-wrap items-center gap-1 text-xs text-[#8A94A6]" aria-label="麵包屑">
      <Link href="/recipes" className="hover:text-[#153E73]">
        食譜
      </Link>
      <ChevronRight className="h-3.5 w-3.5" />
      {categoryName ? (
        <>
          <span>{categoryName}</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </>
      ) : null}
      <span className="line-clamp-1 text-[#153E73]">{title}</span>
    </nav>
  );
}
