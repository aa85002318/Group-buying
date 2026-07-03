import { BottomNav } from "@/components/layout/BottomNav";
import { Header } from "@/components/layout/Header";
import { SiteFooter } from "@/components/layout/SiteFooter";

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto min-h-screen w-full max-w-lg overflow-x-hidden px-4 pb-20 pt-[calc(var(--header-height)+var(--header-content-gap))] md:max-w-7xl md:pb-4">
        {children}
        <SiteFooter />
        <BottomNav />
      </div>
    </div>
  );
}
