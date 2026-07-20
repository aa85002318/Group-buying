import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-button text-sm font-bold transition duration-250 ease-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-[0.98] disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-disabled disabled:text-white disabled:opacity-100 disabled:hover:translate-y-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white shadow-card hover:bg-primary-hover active:bg-primary-active",
        primary:
          "bg-primary text-white shadow-card hover:bg-primary-hover active:bg-primary-active",
        groupBuy:
          "bg-groupBuy text-white shadow-card hover:bg-groupBuy-hover focus-visible:ring-groupBuy/40",
        promo:
          "bg-groupBuy text-white shadow-card hover:bg-groupBuy-hover focus-visible:ring-groupBuy/40",
        secondary:
          "border-2 border-primary bg-surface text-primary hover:bg-primary-soft",
        caramel:
          "bg-caramel text-white shadow-card hover:bg-caramel-hover focus-visible:ring-caramel/40",
        outline:
          "border border-border bg-transparent text-caramel hover:bg-peach-soft",
        ghost: "bg-transparent text-caramel hover:bg-caramel-soft",
        destructive:
          "bg-error text-white hover:opacity-90 focus-visible:ring-error/40",
        mint: "bg-success text-white shadow-card hover:opacity-95",
      },
      size: {
        default: "h-11 min-h-11 px-5 py-2",
        sm: "h-9 min-h-9 px-3 text-xs",
        lg: "h-12 min-h-12 px-6 text-base",
        icon: "h-11 w-11 min-h-touch min-w-touch",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
            aria-hidden
          />
          <span>{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  )
);
Button.displayName = "Button";

export { buttonVariants };
