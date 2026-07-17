import Image from "next/image";
import Link from "next/link";
import { BRAND_NAME, BRAND_SUBTITLE } from "@/lib/env";
import { cn } from "@/lib/utils";

const sizes = {
  sm: { width: 36, height: 36, className: "h-9 w-9" },
  header: {
    width: 204,
    height: 71,
    className: "h-auto w-[116px] sm:w-[140px] md:w-[180px]",
  },
  md: { width: 180, height: 180, className: "h-auto w-[180px]" },
  lg: { width: 260, height: 260, className: "h-auto w-[min(260px,80vw)]" },
  auth: { width: 120, height: 120, className: "h-[96px] w-[96px] md:h-[120px] md:w-[120px]" },
} as const;

interface LogoProps {
  size?: keyof typeof sizes;
  className?: string;
  href?: string;
  priority?: boolean;
  /** Character mark only (no baked-in wordmark) — use with withText */
  markOnly?: boolean;
  /** Show brand text beside/below the image */
  withText?: boolean;
  title?: string;
  subtitle?: string;
  align?: "left" | "center";
  textLayout?: "beside" | "below";
}

export function Logo({
  size = "md",
  className,
  href,
  priority,
  markOnly = false,
  withText = false,
  title = BRAND_NAME,
  subtitle = BRAND_SUBTITLE,
  align = "left",
  textLayout,
}: LogoProps) {
  const { width, height, className: sizeClass } = sizes[size];
  const layout = textLayout ?? (size === "header" || size === "sm" ? "beside" : "below");
  const src =
    size === "header"
      ? "/brand/chimeidiy-header-logo-transparent.png"
      : markOnly || withText
        ? "/images/logo-mark.png"
        : "/images/logo.png";

  const image = (
    <Image
      src={src}
      alt={title}
      width={width}
      height={height}
      className={cn("shrink-0 bg-transparent object-contain", sizeClass, !withText && className)}
      priority={priority}
      unoptimized
    />
  );

  const text = withText ? (
    <span
      className={cn(
        "min-w-0",
        align === "center" && layout === "below" ? "text-center" : "text-left"
      )}
    >
      <span
        className={cn(
          "block truncate font-bold leading-tight text-brand-ink",
          size === "header" || size === "sm" ? "text-base md:text-lg" : "text-xl md:text-2xl"
        )}
      >
        {title}
      </span>
      <span
        className={cn(
          "mt-0.5 block truncate font-medium text-brand-orange",
          size === "header" || size === "sm" ? "text-[11px] md:text-xs" : "text-sm"
        )}
      >
        {subtitle}
      </span>
    </span>
  ) : null;

  const content = withText ? (
    <span
      className={cn(
        "inline-flex min-w-0",
        layout === "beside" ? "items-center gap-2 md:gap-3" : "flex-col items-center gap-3",
        align === "center" && layout === "beside" && "justify-center",
        className
      )}
    >
      {image}
      {text}
    </span>
  ) : (
    image
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex min-w-0 shrink-0 no-underline">
        {content}
      </Link>
    );
  }

  return content;
}
