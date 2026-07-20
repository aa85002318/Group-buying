import { Header } from "@/components/layout/Header";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ClientProviders } from "@/components/layout/ClientProviders";
import { ConsumerHubNav } from "@/components/consumer/ConsumerHubNav";

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientProviders>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto w-full max-w-7xl overflow-x-hidden px-4 pb-24 pt-[calc(var(--header-height)+var(--header-content-gap))] md:px-8 md:pb-4 lg:px-12">
          <ConsumerHubNav />
          {children}
          <SiteFooter />
          <MobileBottomNav />
        </div>
      </div>
    </ClientProviders>
  );
}
