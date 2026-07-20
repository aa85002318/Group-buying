import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean;
  success?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, success, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-11 min-h-touch w-full rounded-input border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-secondary transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary",
        "disabled:cursor-not-allowed disabled:bg-surface-soft disabled:text-disabled disabled:opacity-70",
        error
          ? "border-error focus-visible:ring-error/30 focus-visible:border-error"
          : success
            ? "border-success focus-visible:ring-success/30 focus-visible:border-success"
            : "border-border",
        className
      )}
      aria-invalid={error || undefined}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";
