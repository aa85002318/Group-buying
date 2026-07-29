import { cn } from "@/lib/utils";

export function BrandHeroSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("w-full px-[15px]", className)} aria-busy aria-label="載入中">
      <div className="relative mx-auto w-full max-w-[1280px] animate-pulse overflow-hidden rounded-[24px] bg-[var(--brand-surface-muted)]" style={{ aspectRatio: "16/9" }}>
        {/* simulate bottom search bar */}
        <div className="absolute bottom-[5%] left-[5%] right-[5%] h-[56px] rounded-[18px] bg-white/70 max-[767px]:h-[46px] max-[767px]:rounded-[14px]" />
      </div>
    </div>
  );
}
