import { cn } from "@/lib/utils";

export function BrandHeroSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("w-full bg-[#FFFEFA] px-[15px] pt-2", className)}
      aria-busy
      aria-label="載入中"
    >
      <div className="relative mx-auto w-full max-w-[1280px]">
        <div
          className="animate-pulse overflow-hidden rounded-[32px]"
          style={{
            height: "clamp(280px, 42vw, 360px)",
            background:
              "radial-gradient(ellipse 80% 70% at 70% 40%, #FFE88A 0%, #FFD454 55%, #FFC93A 100%)",
          }}
        />
        <div
          className="relative z-[5] mx-auto animate-pulse"
          style={{ marginTop: "calc(var(--brand-search-float, 28px) * -1)" }}
        >
          <div className="h-[60px] rounded-full bg-white shadow-[0_12px_32px_rgba(21,62,115,0.1)]" />
          <div className="mt-5 h-4 w-20 rounded bg-[#E9EDF2]" />
          <div className="mt-3 flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-9 w-20 shrink-0 rounded-full bg-[#E9EDF2]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
