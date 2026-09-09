import type { ReactNode } from "react";
import { DESKTOP_COLORS } from "@/lib/desktop/brand-assets";

export type DesktopBreadcrumbItem = {
  label: string;
  href?: string;
};

export type DesktopNavItem = {
  key: string;
  label: string;
  href?: string;
};

export type DesktopFilterOption = {
  value: string;
  label: string;
};

export type DesktopFilterGroup = {
  key: string;
  title: string;
  type?: "checkbox" | "radio";
  options: DesktopFilterOption[];
};

export type DesktopInnerHeroProps = {
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  height?: 180 | 220 | 320 | 360 | 380;
  enabled?: boolean;
};

export type DesktopPageToolbarProps = {
  title: string;
  description?: string;
  totalLabel?: string;
  sortValue?: string;
  sortOptions?: DesktopFilterOption[];
  onSortChange?: (value: string) => void;
  trailing?: ReactNode;
};

export type DesktopSidebarProps = {
  title?: string;
  items: DesktopNavItem[];
  activeKey?: string;
  onItemSelect?: (key: string) => void;
  filters?: DesktopFilterGroup[];
  selectedFilters?: Record<string, string[]>;
  onFilterChange?: (groupKey: string, values: string[]) => void;
  onClearFilters?: () => void;
};

export type DesktopPaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export const INNER_HERO_HEIGHTS = [180, 220, 320, 360, 380] as const;

export const DESKTOP_INNER_BG = DESKTOP_COLORS.warmWhite;
