export type BrandNavItem = {
  id: string;
  label: string;
  href: string;
  iconKey?: string | null;
  requiresAuth?: boolean;
  mobileVisible?: boolean;
  desktopVisible?: boolean;
  enabled?: boolean;
  sortOrder?: number;
};

export type BrandNavigationType = "header" | "drawer" | "bottom";
