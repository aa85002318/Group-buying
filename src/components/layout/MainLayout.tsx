import { Header } from "@/components/layout/Header";
import { AppHeader } from "@/components/layout/AppHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { PageContainer } from "@/components/layout/PageContainer";
import { SiteFooter } from "@/components/layout/SiteFooter";

/** Set true to use legacy multi-row header (categories + promo strip). */
const USE_LEGACY_HEADER = false;

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {USE_LEGACY_HEADER ? <Header /> : <AppHeader />}
      <div
        className="w-full overflow-x-hidden pb-24 pt-[calc(var(--header-height)+var(--header-content-gap))] md:pb-4"
      >
        <PageContainer flush className="min-h-[50vh] pb-6 pt-2">
          {children}
          <SiteFooter />
        </PageContainer>
        <MobileBottomNav />
      </div>
    </div>
  );
}
