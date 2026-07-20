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

/** Soft tint + colored icon — Visual System 2.0 */
const TONES: Record<BrandIconName, string> = {
  products: "bg-primary-soft text-primary",
  groupBuy: "bg-groupBuy-soft text-groupBuy",
  live: "bg-error-soft text-error",
  courses: "bg-warning-soft text-foreground",
  articles: "bg-info-soft text-info",
  favorites: "bg-primary-soft text-primary",
  carrier: "bg-warning-soft text-foreground",
  stores: "bg-success-soft text-success",
  support: "bg-info-soft text-info",
  member: "bg-surface-soft text-primary",
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

/** Unified soft brand icons */
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
