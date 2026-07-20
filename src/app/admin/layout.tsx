import { AdminShell } from "@/components/admin/AdminShell";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { AdminDesktopSidebar, AdminMobileDrawer } from "@/components/layout/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminShell>
      <div className="min-h-screen overflow-x-hidden bg-[#F7F8FC]">
        <div className="flex min-h-screen w-full">
          <AdminDesktopSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <AdminTopBar />
            <AdminMobileDrawer />
            <main className="min-w-0 flex-1 overflow-x-hidden p-4 md:p-6">
              <div className="mx-auto w-full max-w-7xl">{children}</div>
            </main>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
