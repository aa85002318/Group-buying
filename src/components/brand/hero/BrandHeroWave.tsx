/** Soft layered white wave — full width, no side gaps. */
export function BrandHeroWave({ className }: { className?: string }) {
  return (
    <div
      className={className}
      aria-hidden
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: -2,
        width: "100%",
        height: "clamp(64px, 18%, 110px)",
        pointerEvents: "none",
        zIndex: 3,
        overflow: "hidden",
      }}
    >
      <svg
        viewBox="0 0 1440 160"
        preserveAspectRatio="none"
        className="absolute inset-0 block h-full w-full"
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <defs>
          <linearGradient id="heroWaveFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFEFA" stopOpacity="0" />
            <stop offset="40%" stopColor="#FFFEFA" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#FFFEFA" stopOpacity="1" />
          </linearGradient>
        </defs>
        <path
          d="M0,48 C160,110 320,16 480,52 C640,88 800,130 960,78 C1120,26 1280,40 1440,70 L1440,160 L0,160 Z"
          fill="url(#heroWaveFade)"
        />
        <path
          d="M0,88 C180,140 360,44 540,76 C720,108 900,148 1080,96 C1220,58 1340,64 1440,90 L1440,160 L0,160 Z"
          fill="#FFFEFA"
        />
      </svg>
    </div>
  );
}
