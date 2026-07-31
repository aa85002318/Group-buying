import Link from "next/link";
import { cn } from "@/lib/utils";

export function GroupBuyHubHeader({
  title,
  href = "/group-buy",
  linkLabel = "查看更多",
  className,
}: {
  title: React.ReactNode;
  href?: string;
  linkLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-3.5 flex items-center justify-between gap-3", className)}>
      <h2 className="text-[20px] font-extrabold leading-tight text-[#153E73] md:text-[24px]">
        {title}
      </h2>
      <Link
        href={href}
        className="shrink-0 text-[14px] font-bold text-[#153E73] transition hover:opacity-75"
      >
        {linkLabel} &gt;
      </Link>
    </div>
  );
}
