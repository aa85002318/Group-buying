import Image from "next/image";
import { DEFAULT_HOME_HERO_IMAGE } from "./types";

export function BrandHeroImage({
  desktopUrl,
  mobileUrl,
  alt,
  position = "center",
  fallbackYellow = true,
}: {
  desktopUrl?: string | null;
  mobileUrl?: string | null;
  alt: string;
  position?: "left" | "center" | "right";
  /** When no image, show warm yellow lifestyle canvas instead of empty. */
  fallbackYellow?: boolean;
}) {
  const desktop = desktopUrl || mobileUrl;
  const mobile = mobileUrl || desktopUrl;

  const objectPos =
    position === "left" ? "left center" : position === "right" ? "right center" : "center";

  if (!desktop && !mobile) {
    if (!fallbackYellow) return null;
    return (
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 70% 40%, #FFE88A 0%, #FFD454 55%, #FFC93A 100%)",
        }}
      >
        {/* Soft sparkles */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 12% 22%, rgba(255,255,255,0.9) 0 1.5px, transparent 2px)," +
              "radial-gradient(circle at 28% 58%, rgba(255,255,255,0.7) 0 1px, transparent 2px)," +
              "radial-gradient(circle at 78% 18%, rgba(255,255,255,0.85) 0 1.5px, transparent 2px)," +
              "radial-gradient(circle at 88% 62%, rgba(255,255,255,0.6) 0 1px, transparent 2px)," +
              "radial-gradient(circle at 48% 12%, rgba(255,255,255,0.75) 0 1px, transparent 2px)",
            backgroundSize: "100% 100%",
          }}
        />
      </div>
    );
  }

  return (
    <picture className="absolute inset-0 block h-full w-full">
      {mobile && mobile !== desktop ? (
        <source media="(max-width: 767px)" srcSet={mobile} />
      ) : null}
      {desktop ? (
        <Image
          src={desktop}
          alt={alt}
          fill
          priority
          className="object-cover"
          style={{ objectPosition: objectPos }}
          sizes="(max-width: 768px) 100vw, 1280px"
          unoptimized
        />
      ) : null}
    </picture>
  );
}

export { DEFAULT_HOME_HERO_IMAGE };
