import { BrandCard } from "./BrandCard";
import { BrandButton } from "@/components/brand/button/BrandButton";
import { formatCurrency } from "@/lib/utils";
import type { CourseCardProps } from "./types";

export function CourseCard({
  title,
  href,
  coverImage,
  teacher,
  dateLabel,
  timeLabel,
  price,
  seatsLeft,
  className,
}: CourseCardProps) {
  const description = [teacher, dateLabel, timeLabel].filter(Boolean).join(" · ");

  return (
    <BrandCard
      className={className}
      href={href}
      image={coverImage}
      imageAlt={title}
      title={title}
      description={description || null}
      footer={
        <div className="flex items-center justify-between gap-2 pt-1">
          <div>
            {price != null ? (
              <p className="text-sm font-bold text-[var(--brand-primary)]">
                {formatCurrency(price)}
              </p>
            ) : null}
            {seatsLeft != null ? (
              <p className="text-[11px] text-[var(--brand-text-muted)]">剩餘 {seatsLeft} 名</p>
            ) : null}
          </div>
          <BrandButton size="sm">立即報名</BrandButton>
        </div>
      }
    />
  );
}
