import type { ReactNode } from "react";
import { DesktopBreadcrumb } from "@/components/desktop/layout/DesktopBreadcrumb";
import { DesktopInnerHero } from "@/components/desktop/layout/DesktopInnerHero";
import { DesktopPageToolbar } from "@/components/desktop/layout/DesktopPageToolbar";
import { DesktopSidebar } from "@/components/desktop/layout/DesktopSidebar";
import type {
  DesktopBreadcrumbItem,
  DesktopInnerHeroProps,
  DesktopPageToolbarProps,
  DesktopSidebarProps,
} from "@/components/desktop/layout/types";
import { DesktopContainer } from "@/components/desktop/DesktopContainer";
import { DESKTOP_INNER_BG } from "@/components/desktop/layout/types";

type DesktopInnerPageLayoutProps = {
  hero?: DesktopInnerHeroProps | null;
  breadcrumb: DesktopBreadcrumbItem[];
  sidebar?: DesktopSidebarProps | null;
  toolbar?: DesktopPageToolbarProps | null;
  children: ReactNode;
  footerSlot?: ReactNode;
};

/**
 * Shared Desktop inner-page skeleton (not used on homepage).
 * Mobile keeps its own layouts via DesktopV2Gate.
 */
export function DesktopInnerPageLayout({
  hero,
  breadcrumb,
  sidebar,
  toolbar,
  children,
  footerSlot,
}: DesktopInnerPageLayoutProps) {
  return (
    <div className="desktop-inner-page w-full" style={{ background: DESKTOP_INNER_BG }}>
      {hero ? <DesktopInnerHero {...hero} /> : null}
      <DesktopBreadcrumb items={breadcrumb} />
      <DesktopContainer className="pb-12">
        <div className="grid gap-7 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)]">
          {sidebar ? (
            <div className="min-w-0">
              <div className="sticky top-[96px]">
                <DesktopSidebar {...sidebar} />
              </div>
            </div>
          ) : null}
          <div className="min-w-0">
            {toolbar ? <DesktopPageToolbar {...toolbar} /> : null}
            {children}
            {footerSlot}
          </div>
        </div>
      </DesktopContainer>
    </div>
  );
}
