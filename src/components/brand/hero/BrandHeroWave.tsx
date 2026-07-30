/** Soft organic wave that blends hero into the page (Apple Weather / Airbnb feel). */
export function BrandHeroWave({ className }: { className?: string }) {
  return (
    <div
      className={className}
      aria-hidden
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: -1,
        height: "28%",
        pointerEvents: "none",
        zIndex: 3,
      }}
    >
      <svg
        viewBox="0 0 1440 160"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id="heroWaveFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFEFA" stopOpacity="0" />
            <stop offset="45%" stopColor="#FFFEFA" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#FFFEFA" stopOpacity="1" />
          </linearGradient>
        </defs>
        <path
          d="M0,72 C180,128 360,20 540,56 C720,92 900,140 1080,88 C1200,52 1320,28 1440,64 L1440,160 L0,160 Z"
          fill="url(#heroWaveFade)"
        />
        <path
          d="M0,96 C200,148 380,48 560,80 C740,112 900,150 1100,100 C1240,64 1340,52 1440,84 L1440,160 L0,160 Z"
          fill="#FFFEFA"
          opacity="0.92"
        />
      </svg>
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: "55%",
          background:
            "linear-gradient(180deg, rgba(255,254,250,0) 0%, rgba(255,254,250,0.7) 40%, #FFFEFA 100%)",
          filter: "blur(6px)",
        }}
      />
    </div>
  );
}
