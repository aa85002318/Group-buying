export type BrandTagVariant =
  | "default"
  | "popular"
  | "new"
  | "sale"
  | "limited"
  | "success"
  | "warning";

export type BrandTagProps = {
  variant?: BrandTagVariant;
  className?: string;
  children: React.ReactNode;
  as?: "span" | "button";
  onClick?: () => void;
};
