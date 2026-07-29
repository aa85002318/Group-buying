export type BrandButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";

export type BrandButtonSize = "sm" | "md" | "lg";

export type BrandButtonProps = {
  variant?: BrandButtonVariant;
  size?: BrandButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">;
