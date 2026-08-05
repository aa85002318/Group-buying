import type { ReactNode } from "react";
import { Noto_Sans_TC } from "next/font/google";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { BrandingCssVars } from "@/components/branding/BrandingCssVars";
import { AdminDesktopSidebar, AdminMobileDrawer } from "@/components/layout/AdminSidebar";
import "@/styles/admin-theme.css";

const notoSansTC = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-admin-sans",
});

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminShell>
      <BrandingCssVars />
      <div
        className={`admin-app min-h-[100dvh] overflow-x-hidden ${notoSansTC.variable} ${notoSansTC.className}`}
        style={{ background: "var(--admin-bg, #FFFDF6)" }}
      >
        <div className="flex min-h-[100dvh] w-full">
          <AdminDesktopSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <AdminTopBar />
            <AdminMobileDrawer />
            <main className="min-w-0 flex-1 overflow-x-hidden p-4 md:p-6 lg:p-8">
              <div className="admin-page-enter mx-auto w-full max-w-[1600px]">{children}</div>
            </main>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
