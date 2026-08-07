export function SideMenuEmptyState({
  message,
  actionLabel,
  onAction,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="px-4 py-10 text-center">
      <p className="text-sm text-[#687386]">{message}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex h-11 items-center justify-center rounded-2xl bg-[#FFD454] px-4 text-sm font-bold text-[#153E73]"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function SideMenuSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 px-4 py-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-12 w-12 animate-pulse rounded-full bg-[#FFF5CC]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 animate-pulse rounded bg-[#F0ECE5]" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-[#F0ECE5]" />
          </div>
        </div>
      ))}
    </div>
  );
}
