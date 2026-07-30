import { cn } from "@/lib/utils";

export function BrandHeroSkeleton({
  className,
  fullBleed = false,
}: {
  className?: string;
  fullBleed?: boolean;
}) {
  if (fullBleed) {
    return (
      <div
        className={cn("w-full max-w-full overflow-x-hidden bg-[#FFFEFA]", className)}
        aria-busy
        aria-label="載入中"
      >
        <div
          className={cn(
            "w-full animate-pulse",
            "h-[clamp(260px,68vw,400px)]",
            "min-[480px]:h-[clamp(300px,56vw,420px)]",
            "md:h-[clamp(340px,46vw,460px)]",
            "lg:h-[clamp(380px,32vw,500px)]"
          )}
          style={{
            background:
              "linear-gradient(135deg, #FFD454 0%, #FFE483 55%, #FFF0B8 100%)",
            paddingTop: "env(safe-area-inset-top, 0px)",
          }}
        />
        <div className="mx-auto w-full max-w-[960px] px-5 pt-3 md:max-w-[1100px] md:px-8 lg:max-w-[1280px]">
          <div
            className="h-[60px] animate-pulse rounded-full bg-white"
            style={{ boxShadow: "0 12px 30px rgba(21, 62, 115, 0.08)" }}
          />
          <div className="mt-5 h-4 w-20 animate-pulse rounded bg-[#E9EDF2]" />
          <div className="mt-3 flex gap-2.5 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-11 w-24 shrink-0 animate-pulse rounded-full bg-[#E9EDF2]"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("w-full bg-[#FFFEFA] px-[15px] pt-2", className)}
      aria-busy
      aria-label="載入中"
    >
      <div className="relative mx-auto w-full max-w-[1280px]">
        <div
          className="animate-pulse overflow-hidden rounded-[24px]"
          style={{
            aspectRatio: "16 / 9",
            maxHeight: "380px",
            background:
              "linear-gradient(135deg, #FFD454 0%, #FFE483 55%, #FFF0B8 100%)",
          }}
        />
        <div className="relative z-[5] mx-auto pt-3">
          <div className="h-[60px] animate-pulse rounded-full bg-white shadow-[0_12px_30px_rgba(21,62,115,0.08)]" />
        </div>
      </div>
    </div>
  );
}
