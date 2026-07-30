import Image from "next/image";
import { DEFAULT_HOME_HERO_IMAGE } from "./types";

export function BrandHeroImage({
  desktopUrl,
  mobileUrl,
  alt,
  position = "center",
  fallbackYellow = true,
  fit = "cover",
}: {
  desktopUrl?: string | null;
  mobileUrl?: string | null;
  alt: string;
  position?: "left" | "center" | "right";
  fallbackYellow?: boolean;
  fit?: "cover" | "contain";
}) {
  const desktop = desktopUrl || mobileUrl;
  const mobile = mobileUrl || desktopUrl;

  const objectPos =
    position === "left"
      ? "left center"
      : position === "right"
        ? "right center"
        : "center center";

  if (!desktop && !mobile) {
    if (!fallbackYellow) return null;
    return (
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background:
            "linear-gradient(135deg, #FFD454 0%, #FFE483 55%, #FFF0B8 100%)",
        }}
      />
    );
  }

  return (
    <picture className="absolute inset-0 block h-full w-full overflow-hidden">
      {mobile && mobile !== desktop ? (
        <source media="(max-width: 767px)" srcSet={mobile} />
      ) : null}
      {desktop ? (
        <Image
          src={desktop}
          alt={alt}
          fill
          priority
          className={fit === "contain" ? "object-contain" : "object-cover"}
          style={{ objectPosition: objectPos }}
          sizes="100vw"
          unoptimized
        />
      ) : null}
    </picture>
  );
}

export { DEFAULT_HOME_HERO_IMAGE };
