import { cn } from "@/lib/utils";

type DesktopContainerProps = {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "main";
};

/** Desktop content width: max 1440px with responsive inline padding. */
export function DesktopContainer({
  children,
  className,
  as: Tag = "div",
}: DesktopContainerProps) {
  return (
    <Tag
      className={cn(
        "mx-auto w-full max-w-[1440px]",
        "px-6 xl:px-8 2xl:px-10",
        className
      )}
    >
      {children}
    </Tag>
  );
}
