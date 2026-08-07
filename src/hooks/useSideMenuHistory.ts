"use client";

import { useCallback, useRef, useState } from "react";
import type { SideMenuPanelState, SideMenuSectionKey } from "@/types/navigation";
import { SIDE_MENU_SECTION_TITLES } from "@/lib/navigation/side-menu-registry";

function panelId() {
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const POP_MS = 220;

export function useSideMenuHistory() {
  const [panels, setPanels] = useState<SideMenuPanelState[]>([
    { id: "root", level: 1, section: "home", title: "選單" },
  ]);
  const [exitingId, setExitingId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const scrollPositions = useRef<Record<string, number>>({});
  const popTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelsRef = useRef(panels);
  panelsRef.current = panels;

  const resetToRoot = useCallback(() => {
    if (popTimer.current) clearTimeout(popTimer.current);
    setExitingId(null);
    setIsTransitioning(false);
    setPanels([{ id: "root", level: 1, section: "home", title: "選單" }]);
  }, []);

  const reset = resetToRoot;

  const pushSection = useCallback(
    (section: SideMenuSectionKey, title?: string) => {
      if (isTransitioning) return;
      if (section === "home") {
        resetToRoot();
        return;
      }
      setPanels((prev) => {
        const top = prev[prev.length - 1];
        if (
          top &&
          top.section === section &&
          !top.categoryId &&
          Boolean(top.isSearch) === (section === "search")
        ) {
          return prev;
        }
        if (section === "search") {
          return [
            ...prev,
            {
              id: panelId(),
              level: prev.length + 1,
              section: "search",
              title: "搜尋",
              isSearch: true,
            },
          ];
        }
        const label =
          title ||
          (section in SIDE_MENU_SECTION_TITLES
            ? SIDE_MENU_SECTION_TITLES[
                section as keyof typeof SIDE_MENU_SECTION_TITLES
              ]
            : "選單");
        return [
          ...prev,
          {
            id: panelId(),
            level: prev.length + 1,
            section,
            title: label,
          },
        ];
      });
    },
    [isTransitioning, resetToRoot]
  );

  const pushCategory = useCallback(
    (input: {
      section: SideMenuSectionKey;
      title: string;
      categoryId: string;
      parentCategoryId?: string;
    }) => {
      if (isTransitioning) return;
      setPanels((prev) => [
        ...prev,
        {
          id: panelId(),
          level: prev.length + 1,
          section: input.section,
          title: input.title,
          categoryId: input.categoryId,
          parentCategoryId: input.parentCategoryId,
        },
      ]);
    },
    [isTransitioning]
  );

  const pop = useCallback(() => {
    if (isTransitioning) return false;
    const prev = panelsRef.current;
    if (prev.length <= 1) return false;
    const top = prev[prev.length - 1]!;
    setExitingId(top.id);
    setIsTransitioning(true);
    if (popTimer.current) clearTimeout(popTimer.current);
    popTimer.current = setTimeout(() => {
      setPanels((p) => (p.length <= 1 ? p : p.slice(0, -1)));
      setExitingId(null);
      setIsTransitioning(false);
    }, POP_MS);
    return true;
  }, [isTransitioning]);

  const saveScroll = useCallback((panelKey: string, y: number) => {
    scrollPositions.current[panelKey] = y;
  }, []);

  const getScroll = useCallback((panelKey: string) => {
    return scrollPositions.current[panelKey] ?? 0;
  }, []);

  return {
    panels,
    active: panels[panels.length - 1]!,
    canPop: panels.length > 1,
    exitingId,
    isTransitioning,
    reset,
    resetToRoot,
    pushSection,
    pushCategory,
    pop,
    saveScroll,
    getScroll,
  };
}
