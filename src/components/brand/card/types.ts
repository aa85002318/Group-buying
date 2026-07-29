export type BrandCardProps = {
  image?: string | null;
  imageAlt?: string;
  title: string;
  description?: string | null;
  href?: string;
  badges?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  aspectClassName?: string;
};

export type ProductCardProps = {
  id: string;
  name: string;
  href: string;
  imageUrl?: string | null;
  spec?: string | null;
  price: number;
  originalPrice?: number | null;
  appPrice?: number | null;
  badges?: Array<"new" | "sale" | "hot" | "limited">;
  favorited?: boolean;
  onFavorite?: () => void;
  onAddToCart?: () => void;
  className?: string;
};

export type RecipeCardProps = {
  id: string;
  title: string;
  href: string;
  coverImage?: string | null;
  durationMinutes?: number | null;
  difficulty?: string | null;
  rating?: number | null;
  kitHref?: string | null;
  className?: string;
};

export type CourseCardProps = {
  id: string;
  title: string;
  href: string;
  coverImage?: string | null;
  teacher?: string | null;
  dateLabel?: string | null;
  timeLabel?: string | null;
  price?: number | null;
  seatsLeft?: number | null;
  className?: string;
};

export type GroupBuyCardProps = {
  id: string;
  title: string;
  href: string;
  imageUrl?: string | null;
  price?: number | null;
  originalPrice?: number | null;
  endAt?: string | null;
  progressPercent?: number | null;
  className?: string;
};
