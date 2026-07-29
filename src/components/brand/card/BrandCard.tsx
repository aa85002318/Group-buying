import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { BrandCardProps } from "./types";

export function BrandCard({
  image,
  imageAlt = "",
  title,
  description,
  href,
  badges,
  footer,
  className,
  aspectClassName = "aspect-[4/3]",
}: BrandCardProps) {
  const media = (
    <div className={cn("relative bg-[var(--brand-surface-muted)]", aspectClassName)}>
      {image ? (
        <Image
          src={image}
          alt={imageAlt || title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 240px"
          unoptimized
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs text-[var(--brand-text-muted)]">
          CHIMEIDIY
        </div>
      )}
      {badges ? <div className="absolute left-2 top-2 flex flex-wrap gap-1">{badges}</div> : null}
    </div>
  );

  return (
    <article
      className={cn(
        "overflow-hidden rounded-[var(--brand-card-radius)] border border-[var(--brand-border)] bg-[var(--brand-surface)] shadow-[var(--shadow-xs)] transition-[transform,box-shadow] duration-[var(--motion-normal)]",
        href && "hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]",
        className
      )}
    >
      {href ? (
        <Link href={href} className="brand-focus-ring block">
          {media}
        </Link>
      ) : (
        media
      )}
      <div className="space-y-1.5 p-3">
        {href ? (
          <Link href={href} className="brand-focus-ring">
            <h3 className="line-clamp-2 text-[13px] font-bold text-[var(--brand-text-primary)]">
              {title}
            </h3>
          </Link>
        ) : (
          <h3 className="line-clamp-2 text-[13px] font-bold text-[var(--brand-text-primary)]">
            {title}
          </h3>
        )}
        {description ? (
          <p className="line-clamp-2 text-xs text-[var(--brand-text-secondary)]">{description}</p>
        ) : null}
        {footer}
      </div>
    </article>
  );
}
