"use client";

import { useEffect, useState } from "react";
import type { SideMenuPanelState } from "@/types/navigation";
import {
  SIDE_MENU_PANEL_EASE,
  SIDE_MENU_PANEL_MS,
  SideMenuPanelShell,
} from "@/components/navigation/side-menu/SideMenuOverlay";
import { cn } from "@/lib/utils";

export function SideMenuPanelStack({
  panels,
  exitingId,
  renderPanel,
}: {
  panels: SideMenuPanelState[];
  exitingId: string | null;
  renderPanel: (panel: SideMenuPanelState, isTop: boolean) => React.ReactNode;
}) {
  const [enteredIds, setEnteredIds] = useState(() => new Set(["root"]));

  useEffect(() => {
    const top = panels[panels.length - 1];
    if (!top || enteredIds.has(top.id)) return;
    const id = requestAnimationFrame(() => {
      setEnteredIds((prev) => new Set(prev).add(top.id));
    });
    return () => cancelAnimationFrame(id);
  }, [panels, enteredIds]);

  // GC entered ids for removed panels
  useEffect(() => {
    const ids = new Set(panels.map((p) => p.id));
    setEnteredIds((prev) => {
      const next = new Set<string>();
      prev.forEach((id) => {
        if (ids.has(id) || id === "root") next.add(id);
      });
      return next;
    });
  }, [panels]);

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-r-[24px]">
      {panels.map((panel, index) => {
        const isTop = index === panels.length - 1;
        const isExiting = exitingId === panel.id;
        const depthFromTop = panels.length - 1 - index;
        const entered = enteredIds.has(panel.id);

        let transform = "translate3d(0,0,0)";
        if (isExiting) {
          transform = "translate3d(100%,0,0)";
        } else if (isTop && !entered) {
          transform = "translate3d(100%,0,0)";
        } else if (!isTop) {
          const peek = Math.min(depthFromTop, 2) * 18;
          transform = `translate3d(-${peek}%,0,0)`;
        }

        return (
          <SideMenuPanelShell
            key={panel.id}
            className={cn(
              "w-full",
              !isTop && !isExiting && "pointer-events-none brightness-[0.92]"
            )}
            style={{
              zIndex: 10 + index,
              transform,
              transition: reduced
                ? "opacity 80ms ease-out"
                : `transform ${SIDE_MENU_PANEL_MS}ms ${SIDE_MENU_PANEL_EASE}, filter ${SIDE_MENU_PANEL_MS}ms ease-out`,
              willChange: "transform",
            }}
          >
            {renderPanel(panel, isTop && !isExiting)}
          </SideMenuPanelShell>
        );
      })}
    </div>
  );
}
