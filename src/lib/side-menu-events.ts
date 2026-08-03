/** Cross-component open trigger for AppHamburgerMenu (CMS side menu). */
export const OPEN_SIDE_MENU_EVENT = "chimeidiy:open-side-menu";

export function openSideMenu() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_SIDE_MENU_EVENT));
}
