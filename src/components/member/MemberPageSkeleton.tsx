export function MemberPageSkeleton() {
  return (
    <div className="space-y-4 px-4 pb-[calc(88px+env(safe-area-inset-bottom))] pt-2">
      <div className="h-10 w-24 animate-pulse rounded-xl bg-[#FFF5CC]" />
      <div className="h-44 animate-pulse rounded-2xl bg-[#FFD454]/50" />
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[76px] animate-pulse rounded-2xl bg-white" />
        ))}
      </div>
      <div className="h-28 animate-pulse rounded-2xl bg-white" />
      <div className="h-40 animate-pulse rounded-2xl bg-white" />
      <div className="h-56 animate-pulse rounded-2xl bg-white" />
    </div>
  );
}
