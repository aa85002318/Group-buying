import { cn } from "@/lib/utils";

export function MonsterProgressBar({
  current,
  max,
  label,
  className,
}: {
  current: number;
  max: number;
  label?: string;
  className?: string;
}) {
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0;
  const unlocked = current >= max;

  return (
    <div className={cn("space-y-1", className)}>
      {label && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{label}</span>
          <span>
            {current.toFixed(1)} / {max} kg
          </span>
        </div>
      )}
      <div className="h-3 w-full overflow-hidden rounded-full bg-[#F7DADA]">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            unlocked ? "bg-[#D92D20]" : "bg-[#C94C4C]"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {unlocked && (
        <p className="text-center text-sm font-medium text-[#C94C4C] animate-pulse">
          🎉 恭喜解鎖獎勵門檻！
        </p>
      )}
    </div>
  );
}
