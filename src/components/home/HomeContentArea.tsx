import { cn } from "@/lib/utils";

/** Full-width white content area under the cream hero band. */
export function HomeContentArea({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("home-content-area", className)}>{children}</section>
  );
}
