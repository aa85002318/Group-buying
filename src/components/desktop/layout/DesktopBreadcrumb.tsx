import Link from "next/link";
import type { DesktopBreadcrumbItem } from "@/components/desktop/layout/types";
import { DesktopContainer } from "@/components/desktop/DesktopContainer";
import { cn } from "@/lib/utils";

export function DesktopBreadcrumb({ items }: { items: DesktopBreadcrumbItem[] }) {
  return (
    <DesktopContainer className="py-4">
      <nav aria-label="麵包屑" className="text-[13px] text-[#687386]">
        <ol className="flex flex-wrap items-center gap-1.5">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={`${item.label}-${index}`} className="inline-flex items-center gap-1.5">
                {index > 0 ? <span aria-hidden>/</span> : null}
                {item.href && !isLast ? (
                  <Link href={item.href} className="hover:text-[#153E73]">
                    {item.label}
                  </Link>
                ) : (
                  <span className={cn(isLast && "font-semibold text-[#153E73]")}>
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </DesktopContainer>
  );
}
