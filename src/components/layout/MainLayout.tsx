import { ClientProviders } from "@/components/layout/ClientProviders";
import { AppShell } from "@/components/layout/AppShell";
import { AppAccessGuard } from "@/components/app/AppAccessGuard";

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientProviders>
      <AppAccessGuard>
        <AppShell>{children}</AppShell>
      </AppAccessGuard>
    </ClientProviders>
  );
}
