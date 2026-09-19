import { AdminSectionTabs } from "@/components/admin/AdminSectionTabs";
import { PRODUCT_TOOLS_TABS } from "@/lib/admin/section-tabs";

export default function AdminProductsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminSectionTabs label="批次工具" tabs={PRODUCT_TOOLS_TABS} />
      {children}
    </>
  );
}
