"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export function SideMenuOverlay({
  visible,
  closing,
  onClose,
  children,
  drawerClassName,
}: {
  visible: boolean;
  closing?: boolean;
  onClose: () => void;
  children: React.ReactNode;
  drawerClassName?: string;
}) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!visible) {
      setEntered(false);
      return;
    }
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [visible]);

  if (!visible) return null;

  const open = entered && !closing;
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  return (
    <div className="fixed inset-0 z-[80]" role="presentation">
      <button
        type="button"
        className={cn(
          "absolute inset-0 bg-[rgba(15,23,42,0.42)] transition-opacity",
          reduced ? "duration-75" : "duration-[180ms] ease-out",
          open ? "opacity-100" : "opacity-0"
        )}
        aria-label="關閉選單"
        onClick={onClose}
      />
      <div
        className={cn(
          "absolute bottom-0 left-0 top-0",
          "w-[max(300px,min(92vw,430px))] max-[374px]:w-[94vw] md:w-[420px] lg:w-[440px]",
          "will-change-transform",
          drawerClassName
        )}
        style={{
          transform: open
            ? "translate3d(0,0,0)"
            : "translate3d(-100%,0,0)",
          transition: reduced
            ? "opacity 80ms ease-out, transform 80ms ease-out"
            : `transform 240ms ${EASE}, opacity 180ms ease-out`,
          opacity: open ? 1 : reduced ? 0 : 1,
        }}
      >
        {children}
      </div>
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
        "absolute inset-0 flex h-[100dvh] max-h-[100dvh] min-w-0 flex-col overflow-hidden bg-white",
        "rounded-r-[24px] shadow-[4px_0_24px_rgba(21,62,115,0.12)]",
        "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}

export const SIDE_MENU_PANEL_EASE = EASE;
export const SIDE_MENU_PANEL_MS = 220;
