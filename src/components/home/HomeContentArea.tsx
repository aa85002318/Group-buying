import { cn } from "@/lib/utils";

/** White mid-page content shell — cream page outside, white content inside */
export function HomeContentArea({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("home-content-area space-y-6 md:space-y-8", className)}>
      {children}
    </div>
  );
}
