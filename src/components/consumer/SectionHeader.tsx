import Link from "next/link";
import { cn } from "@/lib/utils";

export function SectionHeader({
  title,
  href,
  linkLabel = "查看更多",
  accentClass = "bg-primary",
  className,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  accentClass?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-center justify-between gap-3", className)}>
      <div className="flex items-center gap-2">
        <span className={cn("h-7 w-1.5 rounded-full", accentClass)} aria-hidden />
        <h2 className="section-title">{title}</h2>
      </div>
      {href ? (
        <Link href={href} className="text-sm font-bold text-primary">
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}
