/** Decorative wave divider between home content bands. */
export function HomeWaveDividerBanner() {
  return (
    <div
      className="home-wave-divider relative w-full overflow-hidden bg-[#FFFEFA]"
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/home-wave-divider.png?v=202607301"
        alt=""
        width={1024}
        height={341}
        className="home-wave-divider__img block w-full"
        decoding="async"
        loading="lazy"
      />
    </div>
  );
}
