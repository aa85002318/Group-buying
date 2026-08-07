"use client";

import { cn } from "@/lib/utils";

export function SideMenuOverlay({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 transition-opacity duration-[260ms] ease-out"
        aria-label="關閉選單"
        onClick={onClose}
      />
      {children}
    </div>
  );
}

export function SideMenuPanelShell({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn(
        "absolute bottom-0 left-0 top-0 flex flex-col overflow-hidden bg-white",
        "rounded-r-[24px] shadow-[4px_0_24px_rgba(21,62,115,0.12)]",
        "w-[max(300px,min(92vw,430px))] max-[374px]:w-[94vw] md:w-[420px] lg:w-[440px]",
        "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}
