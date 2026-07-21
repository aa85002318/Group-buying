import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { APP_ROUTES } from "@/lib/site-links";

const ALT = "CHIMEIDIY 烘焙生活平台";

const VARIANTS = {
  header: {
    src: "/branding/chimeidiy-app-header-logo-v3.png",
    width: 841,
    height: 212,
    className:
      "h-8 w-auto max-h-8 max-w-[min(148px,46vw)] object-contain bg-transparent sm:h-9 sm:max-h-9 sm:max-w-[168px] md:h-10 md:max-h-10 md:max-w-[196px]",
  },
  compact: {
    src: "/branding/chimeidiy-logo-compact.png",
    width: 40,
    height: 40,
    className: "h-10 w-10 max-h-10 object-contain bg-transparent",
  },
  splash: {
    src: "/branding/chimeidiy-app-header-logo-v3.png",
    width: 420,
    height: 106,
    className: "h-auto w-[min(280px,72vw)] max-h-24 object-contain bg-transparent",
  },
  icon: {
    src: "/branding/chimeidiy-app-icon.png",
    width: 48,
    height: 48,
    className: "h-12 w-12 max-h-12 object-contain",
  },
} as const;

export type ChimeidiyLogoVariant = keyof typeof VARIANTS;

export type ChimeidiyLogoProps = {
  variant?: ChimeidiyLogoVariant;
  className?: string;
  priority?: boolean;
  href?: string | null;
};

export function ChimeidiyLogo({
  variant = "header",
  className,
  priority = false,
  href = APP_ROUTES.home,
}: ChimeidiyLogoProps) {
  const config = VARIANTS[variant];
  const image = (
    <Image
      src={config.src}
      alt={ALT}
      width={config.width}
      height={config.height}
      className={cn("bg-transparent", config.className, className)}
      priority={priority}
      unoptimized
    />
  );

  if (href === null) return image;

  return (
    <Link
      href={href}
      className="inline-flex min-w-0 shrink-0 items-center bg-transparent no-underline"
      aria-label={ALT}
    >
      {image}
    </Link>
  );
}
