/** Single soft wave + gradient blend between Hero and search. */
export function HeroBottomTransition() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] w-full max-w-full overflow-hidden"
      aria-hidden
    >
      <div
        className="absolute inset-x-0 bottom-0 h-[48px] md:h-[80px]"
        style={{
          background:
            "linear-gradient(to bottom, rgba(255, 212, 84, 0) 0%, rgba(255, 254, 250, 0.72) 55%, #FFFEFA 100%)",
          zIndex: 1,
        }}
      />
      <svg
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
        className="relative z-[2] block h-[52px] w-full max-w-full md:h-[80px]"
        style={{ filter: "blur(1px)" }}
      >
        <path
          fill="#FFFEFA"
          d="
            M0,44
            C180,28 320,64 500,54
            C700,42 860,72 1040,52
            C1210,34 1330,44 1440,38
            L1440,100
            L0,100
            Z
          "
        />
      </svg>
    </div>
  );
}
