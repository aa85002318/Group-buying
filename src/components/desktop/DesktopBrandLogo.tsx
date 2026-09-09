import Image from "next/image";
import Link from "next/link";
import { DESKTOP_LOGO_SRC } from "@/lib/desktop/brand-assets";
import { APP_ROUTES } from "@/lib/site-links";
import { cn } from "@/lib/utils";

/** Intrinsic ratio of horizontal logo (mark left + wordmark right). */
const LOGO_RATIO = 986 / 381;

type DesktopBrandLogoProps = {
  className?: string;
  /** Visual height in px (width auto via intrinsic ratio). */
  height?: number;
  href?: string | null;
  priority?: boolean;
};

/** Company logo for Desktop Header / Footer only. No IP character. */
export function DesktopBrandLogo({
  className,
  height = 48,
  href = APP_ROUTES.home,
  priority = false,
}: DesktopBrandLogoProps) {
  const width = Math.round(height * LOGO_RATIO);
  const img = (
    <Image
      src={DESKTOP_LOGO_SRC}
      alt="CHIMEIDIY 烘焙材料"
      width={width}
      height={height}
      priority={priority}
      className={cn("object-contain", className)}
      style={{ height, width: "auto", maxHeight: height }}
    />
  );

  if (href === null) return img;
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center"
      aria-label="CHIMEIDIY 首頁"
    >
      {img}
    </Link>
  );
}
