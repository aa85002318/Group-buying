export type BrandHeroKey =
  | "home"
  | "recipes"
  | "products"
  | "courses"
  | "group-buy";

export type BrandHeroTag = {
  id: string;
  label: string;
  keyword?: string | null;
  linkType?: "search" | "url";
  targetUrl?: string | null;
  enabled?: boolean;
  sortOrder?: number;
};

export type BrandHeroData = {
  heroKey: BrandHeroKey | string;
  name?: string;
  title: string;
  subtitle?: string | null;
  desktopImageUrl?: string | null;
  mobileImageUrl?: string | null;
  imageAlt?: string | null;
  searchPlaceholder?: string | null;
  searchScope?:
    | "global"
    | "products"
    | "recipes"
    | "courses"
    | "group_buy"
    | "articles";
  tags?: BrandHeroTag[];
  enabled?: boolean;
};

export type BrandHeroProps = {
  heroKey: BrandHeroKey | string;
  /** Optional override; otherwise fetched from CMS */
  data?: BrandHeroData | null;
  className?: string;
  showSearch?: boolean;
  showTags?: boolean;
};
