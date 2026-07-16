import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  /** Remove default vertical padding */
  flush?: boolean;
  as?: "div" | "main" | "section";
}

/** App content shell: max 1280px, responsive horizontal padding */
export function PageContainer({
  children,
  className,
  flush = false,
  as: Tag = "div",
}: PageContainerProps) {
  return (
    <Tag
      className={cn(
        "mx-auto w-full max-w-app page-pad-x",
        !flush && "py-4 md:py-6",
        className
      )}
    >
      {children}
    </Tag>
  );
}
