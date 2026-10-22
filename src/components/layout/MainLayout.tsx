import { ClientProviders } from "@/components/layout/ClientProviders";
import { AppShell } from "@/components/layout/AppShell";
import { AppAccessGuard } from "@/components/app/AppAccessGuard";
import { BrandingCssVars } from "@/components/branding/BrandingCssVars";
import { InquiryCartFab } from "@/components/products/InquiryCartFab";

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientProviders>
      <BrandingCssVars />
      <AppAccessGuard>
        <AppShell>{children}</AppShell>
        {/* 詢價單裡有商品時才出現的浮動入口。 */}
        <InquiryCartFab />
      </AppAccessGuard>
    </ClientProviders>
  );
}
