"use client";

import { Heart } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/useFavorites";

type FavoriteButtonProps = {
  productId: string;
  className?: string;
  size?: "sm" | "md";
};

export function FavoriteButton({ productId, className, size = "md" }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [pending, setPending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const favorited = isFavorite(productId);
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const btnSize = size === "sm" ? "h-8 w-8" : "h-10 w-10";

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    setPending(true);
    const result = await toggleFavorite(productId);
    setPending(false);
    if (result.ok) {
      setToast(result.favorited ? "已加入收藏" : "已取消收藏");
      setTimeout(() => setToast(null), 2000);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={favorited ? "取消收藏" : "加入收藏"}
        disabled={pending}
        onClick={handleClick}
        className={cn(
          "flex items-center justify-center rounded-full bg-surface/90 shadow-md backdrop-blur-sm transition",
          btnSize,
          pending && "opacity-60",
          className
        )}
      >
        <Heart
          className={cn(iconSize, favorited ? "fill-[#E9285C] text-primary" : "text-foreground-secondary")}
        />
      </button>
      {toast && (
        <span className="absolute -top-8 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#202124] px-2 py-1 text-xs text-white">
          {toast}
        </span>
      )}
    </div>
  );
}
