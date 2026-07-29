import Link from "next/link";
import { Clock3 } from "lucide-react";
import { BrandCard } from "./BrandCard";
import { BrandButton } from "@/components/brand/button/BrandButton";
import type { RecipeCardProps } from "./types";

function difficultyLabel(d?: string | null) {
  if (d === "easy") return "簡單";
  if (d === "hard") return "進階";
  if (d === "medium") return "中等";
  return d || null;
}

export function RecipeCard({
  title,
  href,
  coverImage,
  durationMinutes,
  difficulty,
  rating,
  kitHref,
  className,
}: RecipeCardProps) {
  const meta = [
    durationMinutes != null ? `${durationMinutes} 分` : null,
    difficultyLabel(difficulty),
    rating != null ? `★ ${rating.toFixed(1)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <BrandCard
      className={className}
      href={href}
      image={coverImage}
      imageAlt={title}
      title={title}
      description={meta || null}
      footer={
        kitHref ? (
          <div className="pt-1" onClick={(e) => e.preventDefault()}>
            <Link href={kitHref}>
              <BrandButton size="sm" variant="outline" fullWidth>
                <Clock3 className="h-3.5 w-3.5" aria-hidden />
                材料一鍵購買
              </BrandButton>
            </Link>
          </div>
        ) : null
      }
    />
  );
}
