import Image from "next/image";
import Link from "next/link";
import { DESKTOP_LOGO_SRC } from "@/lib/desktop/brand-assets";
import { APP_ROUTES } from "@/lib/site-links";
import { cn } from "@/lib/utils";

type DesktopBrandLogoProps = {
  className?: string;
  /** Visual height in px (width auto via intrinsic ratio). */
  height?: number;
  href?: string | null;
  priority?: boolean;
};

/** Full CHIMEI DIY logo — Header / Footer only. Never stretch. */
export function DesktopBrandLogo({
  className,
  height = 48,
  href = APP_ROUTES.home,
  priority = false,
}: DesktopBrandLogoProps) {
  const img = (
    <Image
      src={DESKTOP_LOGO_SRC}
      alt="CHIMEI DIY 烘焙生活平台"
      width={Math.round(height * (1024 / 455))}
      height={height}
      priority={priority}
      className={cn("h-auto w-auto object-contain", className)}
      style={{ height, width: "auto", maxHeight: height }}
    />
  );

  if (href === null) return img;
  return (
    <Link href={href} className="inline-flex shrink-0 items-center" aria-label="CHIMEIDIY 首頁">
      {img}
    </Link>
  );
}
