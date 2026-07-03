export function MonsterIllustration({ stage }: { stage: string }) {
  const emoji = stage === "gift" ? "🎁" : stage === "preparing" ? "🍞" : stage === "eating" ? "😋" : "👾";
  return (
    <div className="relative flex flex-col items-center">
      <div className="flex h-32 w-32 items-center justify-center rounded-full bg-[#F7DADA] text-6xl shadow-inner">
        <span role="img" aria-label="麵包小怪獸">
          {emoji}
        </span>
      </div>
      <div className="absolute -bottom-1 rounded-full bg-[#C94C4C] px-3 py-0.5 text-xs text-white">
        🍞 麵包小怪獸
      </div>
    </div>
  );
}
