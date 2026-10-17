import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Homepage section title matching 「精選烘焙材料」:
 * yellow bar + 22/28px bold title + optional subtitle and view-all link.
 */
export function HomeYellowSectionHeader({
  title,
  subtitle,
  href,
  linkLabel = "查看全部",
  className,
}: {
  title: string;
  subtitle?: string | null;
  href?: string | null;
  linkLabel?: string;
  className?: string;
}) {
  return (
    <header className={cn("mb-3.5 flex items-start justify-between gap-3 md:mb-[18px]", className)}>
      <div className="flex min-w-0 items-start gap-2">
        <span
          className="mt-[5px] h-7 w-1.5 shrink-0 rounded-full bg-[#FFD454]"
          aria-hidden
        />
        <div className="min-w-0">
          <h2 className="text-[22px] font-bold leading-[1.25] text-[#153E73] md:text-[28px]">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1.5 line-clamp-1 text-[13px] text-[#687386] md:text-sm">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {href ? (
        <Link
          href={href}
          className="mt-1 inline-flex shrink-0 items-center gap-0.5 text-[14px] font-bold text-[#153E73] hover:text-[#F16458] md:mt-2"
        >
          {linkLabel}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : null}
    </header>
  );
}

/** Same horizontal inset as HomeIngredientShopSection. */
export const HOME_SECTION_INSET =
  "mx-auto w-full max-w-[1440px] px-4 md:px-6 xl:max-w-[1320px]";
