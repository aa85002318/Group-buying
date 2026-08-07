"use client";

import { useCallback, useState } from "react";
import type { SideMenuPanelState, SideMenuSectionKey } from "@/types/navigation";
import { SIDE_MENU_SECTION_TITLES } from "@/lib/navigation/side-menu-registry";

function panelId() {
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function useSideMenuHistory() {
  const [panels, setPanels] = useState<SideMenuPanelState[]>([
    { id: "root", level: 1, section: "home", title: "選單" },
  ]);

  const reset = useCallback(() => {
    setPanels([{ id: "root", level: 1, section: "home", title: "選單" }]);
  }, []);

  const pushSection = useCallback((section: SideMenuSectionKey, title?: string) => {
    if (section === "home") {
      reset();
      return;
    }
    if (section === "search") {
      setPanels((prev) => [
        ...prev,
        {
          id: panelId(),
          level: prev.length + 1,
          section: "search",
          title: "搜尋",
          isSearch: true,
        },
      ]);
      return;
    }
    const label =
      title ||
      (section in SIDE_MENU_SECTION_TITLES
        ? SIDE_MENU_SECTION_TITLES[section as keyof typeof SIDE_MENU_SECTION_TITLES]
        : "選單");
    setPanels((prev) => [
      ...prev,
      {
        id: panelId(),
        level: prev.length + 1,
        section,
        title: label,
      },
    ]);
  }, [reset]);

  const pushCategory = useCallback(
    (input: {
      section: SideMenuSectionKey;
      title: string;
      categoryId: string;
      parentCategoryId?: string;
    }) => {
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
    []
  );

  const pop = useCallback(() => {
    setPanels((prev) => (prev.length <= 1 ? prev : prev.slice(0, -1)));
    return panels.length > 1;
  }, [panels.length]);

  const canPop = panels.length > 1;
  const active = panels[panels.length - 1]!;

  return {
    panels,
    active,
    canPop,
    reset,
    pushSection,
    pushCategory,
    pop,
  };
}
