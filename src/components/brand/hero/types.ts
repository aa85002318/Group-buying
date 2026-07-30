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
  /** Optional override; otherwise fetched from CMS */
  name?: string;
  title: string;
  subtitle?: string | null;
  capsuleLabel?: string | null;
  showTitle?: boolean;
  showSubtitle?: boolean;
  showCtas?: boolean;
  primaryCtaLabel?: string | null;
  primaryCtaHref?: string | null;
  secondaryCtaLabel?: string | null;
  secondaryCtaHref?: string | null;
  desktopImageUrl?: string | null;
  mobileImageUrl?: string | null;
  imageAlt?: string | null;
  imagePosition?: "left" | "center" | "right";
  searchPlaceholder?: string | null;
  searchScope?:
    | "global"
    | "products"
    | "recipes"
    | "courses"
    | "group_buy"
    | "articles";
  showPopularTags?: boolean;
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

/** Default home banner — rectangular full-bleed art (no rounded white frame). */
export const DEFAULT_HOME_HERO_IMAGE = "/brand/hero-home-banner.png?v=20260730b";

/** Intrinsic aspect of the cropped home banner asset (994×540). */
export const HOME_HERO_ASPECT = "994 / 540";
