import { ClientProviders } from "@/components/layout/ClientProviders";
import { AppShell } from "@/components/layout/AppShell";
import { AppAccessGuard } from "@/components/app/AppAccessGuard";
import { BrandingCssVars } from "@/components/branding/BrandingCssVars";

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientProviders>
      <BrandingCssVars />
      <AppAccessGuard>
        <AppShell>{children}</AppShell>
      </AppAccessGuard>
    </ClientProviders>
  );
}
