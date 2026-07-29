import Image from "next/image";

export function BrandHeroImage({
  desktopUrl,
  mobileUrl,
  alt,
  position = "center",
}: {
  desktopUrl?: string | null;
  mobileUrl?: string | null;
  alt: string;
  position?: "left" | "center" | "right";
}) {
  const desktop = desktopUrl || mobileUrl;
  const mobile = mobileUrl || desktopUrl;

  const objectPos =
    position === "left" ? "left center" : position === "right" ? "right center" : "center";

  if (!desktop && !mobile) {
    return (
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#FFF0E6] via-[#FFE4CC] to-[#FFEBD6]"
        aria-hidden
      />
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
