import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const sizes = {
  sm: { width: 36, height: 36, className: "h-9 w-9" },
  header: { width: 140, height: 52, className: "h-[34px] w-auto md:h-[52px]" },
  md: { width: 180, height: 180, className: "h-auto w-[180px]" },
  lg: { width: 260, height: 260, className: "h-auto w-[min(260px,80vw)]" },
  auth: { width: 260, height: 260, className: "h-auto w-[min(260px,75vw)]" },
} as const;

interface LogoProps {
  size?: keyof typeof sizes;
  className?: string;
  href?: string;
  priority?: boolean;
}

export function Logo({ size = "md", className, href, priority }: LogoProps) {
  const { width, height, className: sizeClass } = sizes[size];

  const image = (
    <Image
      src="/images/logo.png"
      alt="chimeidiy 團購"
      width={width}
      height={height}
      className={cn("bg-transparent", sizeClass, className)}
      priority={priority}
      unoptimized
    />
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0 bg-transparent">
        {image}
      </Link>
    );
  }

  return image;
}
