import Link from "next/link";
import { cn } from "@/lib/utils";

/** Matches「一鍵買齊材料」title: yellow bar + navy headline (+ optional subtitle). */
export function GroupBuyHubHeader({
  title,
  subtitle,
  href = "/group-buy",
  linkLabel = "查看更多",
  showLink = true,
  className,
}: {
  title: React.ReactNode;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  showLink?: boolean;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "mb-3.5 flex items-start justify-between gap-3 md:mb-[18px]",
        className
      )}
    >
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
            <p className="mt-1.5 line-clamp-1 text-[13px] text-[#687386] md:text-sm">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
      {showLink ? (
        <Link
          href={href}
          className="mt-1 shrink-0 text-[14px] font-bold text-[#153E73] transition hover:opacity-75 md:mt-2"
        >
          {linkLabel} &gt;
        </Link>
      ) : null}
    </header>
  );
}
