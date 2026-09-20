import Image from "next/image";
import { PageHeroBanner } from "@/components/page-hero/PageHeroBanner";
import { DesktopContainer } from "@/components/desktop/DesktopContainer";
import type { DesktopInnerHeroProps } from "@/components/desktop/layout/types";
import { DESKTOP_COLORS } from "@/lib/desktop/brand-assets";

export function DesktopInnerHero({
  pageKey,
  title,
  subtitle,
  imageUrl,
  height = 360,
  enabled = true,
}: DesktopInnerHeroProps) {
  if (!enabled) return null;
  // Unified hero: image + link only, managed in the admin; the title stays
  // for screen readers / SEO.
  if (pageKey) {
    return <PageHeroBanner pageKey={pageKey} srTitle={title.replace(/\n/g, "")} />;
  }

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ height, background: imageUrl ? "#EEF8FC" : DESKTOP_COLORS.cream }}
      aria-label={title}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
      ) : null}
      {imageUrl ? (
        <div className="absolute inset-0 bg-gradient-to-r from-white/92 via-white/70 to-transparent" />
      ) : null}
      <DesktopContainer className="relative flex h-full items-center py-10 pl-0 pr-6 md:pl-2">
        <div className="max-w-xl text-[#153E73]">
          <h1 className="whitespace-pre-line text-3xl font-bold leading-tight xl:text-4xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-[#687386] xl:text-base">
              {subtitle}
            </p>
          ) : null}
        </div>
      </DesktopContainer>
    </section>
  );
}
