import { cn } from "@/lib/utils";

/** 示意圖：Hero 下方白底圓角中段 */
export function HomeContentArea({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-surface pt-[18px]",
        "rounded-t-[24px]",
        "space-y-7",
        className
      )}
    >
      {children}
    </div>
  );
}
