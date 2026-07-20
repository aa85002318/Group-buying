import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-button text-sm font-bold transition duration-250 ease-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-brand-gradient text-primary-foreground shadow-brand hover:-translate-y-0.5 hover:opacity-95",
        promo:
          "bg-promo-gradient text-brand-ink shadow-sticker hover:-translate-y-0.5 hover:opacity-95",
        secondary:
          "border-2 border-primary bg-white text-primary hover:bg-brand-blush",
        outline:
          "border border-border bg-card text-coffee hover:border-primary/40 hover:bg-brand-blush",
        ghost: "bg-transparent text-primary hover:bg-brand-blush",
        destructive: "bg-[#E53935] text-white hover:bg-[#c62828]",
        mint: "bg-mint-gradient text-white shadow-card hover:-translate-y-0.5",
      },
      size: {
        default: "h-11 min-h-11 px-5 py-2",
        sm: "h-9 min-h-9 px-3 text-xs",
        lg: "h-12 min-h-12 px-6 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  )
);
Button.displayName = "Button";

export { buttonVariants };
