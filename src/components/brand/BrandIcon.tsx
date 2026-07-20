import {
  BookOpen,
  GraduationCap,
  Headphones,
  Heart,
  Package,
  Radio,
  Receipt,
  ShoppingBag,
  Store,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type BrandIconName =
  | "products"
  | "groupBuy"
  | "live"
  | "courses"
  | "articles"
  | "favorites"
  | "carrier"
  | "stores"
  | "support"
  | "member";

const ICONS: Record<BrandIconName, LucideIcon> = {
  products: ShoppingBag,
  groupBuy: Package,
  live: Radio,
  courses: GraduationCap,
  articles: BookOpen,
  favorites: Heart,
  carrier: Receipt,
  stores: Store,
  support: Headphones,
  member: Users,
};

const TONES: Record<BrandIconName, string> = {
  products: "bg-[#FFF0F4] text-[#E9285C]",
  groupBuy: "bg-[#FFF3EC] text-[#FF7A45]",
  live: "bg-[#FDECEA] text-[#E53935]",
  courses: "bg-[#EAF2FF] text-[#3A86FF]",
  articles: "bg-[#E6F8F3] text-[#4CC9A6]",
  favorites: "bg-[#FFF0F4] text-[#E9285C]",
  carrier: "bg-[#FFF8E0] text-[#B8860B]",
  stores: "bg-[#EAF2FF] text-[#3A86FF]",
  support: "bg-[#E6F8F3] text-[#4CC9A6]",
  member: "bg-[#FFF3EC] text-[#FF7A45]",
};

type BrandIconProps = {
  name: BrandIconName;
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
};

const SIZE = {
  sm: { wrap: "h-10 w-10", icon: "h-5 w-5" },
  md: { wrap: "h-12 w-12", icon: "h-6 w-6" },
  lg: { wrap: "h-14 w-14", icon: "h-7 w-7" },
};

/** Unified colorful rounded brand icons */
export function BrandIcon({ name, className, size = "md", label }: BrandIconProps) {
  const Icon = ICONS[name];
  const s = SIZE[size];
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-2xl",
        s.wrap,
        TONES[name],
        className
      )}
      aria-label={label}
      aria-hidden={!label}
    >
      <Icon className={cn(s.icon, "stroke-[2.25]")} />
    </span>
  );
}
