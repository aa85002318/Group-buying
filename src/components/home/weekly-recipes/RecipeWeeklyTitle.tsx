const CHAR_STYLES = [
  { rotate: -3, y: 2, scale: 1.02 },
  { rotate: 2, y: -3, scale: 0.98 },
  { rotate: -1, y: 4, scale: 1.04 },
  { rotate: 3, y: -1, scale: 1 },
  { rotate: -2, y: 3, scale: 1.03 },
  { rotate: 1, y: -4, scale: 0.97 },
];

const DECORATIONS = [
  { emoji: "⭐", className: "left-[8%] top-1 text-[13px]" },
  { emoji: "🍪", className: "right-[10%] top-2 text-[14px]" },
  { emoji: "🥐", className: "left-[18%] bottom-0 text-[12px]" },
  { emoji: "❤️", className: "right-[20%] bottom-1 text-[11px]" },
  { emoji: "✨", className: "left-[4%] top-6 text-[10px]" },
  { emoji: "🥣", className: "right-[6%] top-7 text-[12px]" },
];

export function RecipeWeeklyTitle() {
  const chars = "本週人氣食譜".split("");

  return (
    <div className="relative mx-auto flex max-w-md justify-center px-6">
      {DECORATIONS.map((d) => (
        <span
          key={d.emoji + d.className}
          className={`pointer-events-none absolute select-none opacity-80 ${d.className}`}
          aria-hidden
        >
          {d.emoji}
        </span>
      ))}
      <h2
        className="recipe-weekly-title relative flex items-end justify-center gap-0.5 sm:gap-1"
        aria-label="本週人氣食譜"
      >
        {chars.map((char, i) => {
          const style = CHAR_STYLES[i % CHAR_STYLES.length];
          return (
            <span
              key={`${char}-${i}`}
              className="inline-block font-black leading-none text-[#153E73]"
              style={{
                fontSize: "clamp(1.65rem, 5.5vw, 2rem)",
                transform: `rotate(${style.rotate}deg) translateY(${style.y}px) scale(${style.scale})`,
                textShadow:
                  "2px 2px 0 rgba(255,255,255,0.95), -1px -1px 0 rgba(255,255,255,0.6)",
                WebkitTextStroke: "1px rgba(21, 62, 115, 0.08)",
              }}
            >
              {char}
            </span>
          );
        })}
      </h2>
    </div>
  );
}
