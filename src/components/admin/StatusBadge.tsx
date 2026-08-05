import { cn } from "@/lib/utils";

const VARIANT_CLASS: Record<string, string> = {
  default: "admin-pill admin-pill-secondary",
  secondary: "admin-pill admin-pill-secondary",
  success: "admin-pill admin-pill-success",
  warning: "admin-pill admin-pill-warning",
  danger: "admin-pill admin-pill-danger",
  destructive: "admin-pill admin-pill-danger",
  info: "admin-pill admin-pill-info",
  primary: "admin-pill admin-pill-primary",
};

export function StatusBadge({
  label,
  variant = "default",
  className,
}: {
  label: string;
  variant?: keyof typeof VARIANT_CLASS | string;
  className?: string;
}) {
  return (
    <span className={cn(VARIANT_CLASS[variant] ?? VARIANT_CLASS.default, className)}>
      {label}
    </span>
  );
}
