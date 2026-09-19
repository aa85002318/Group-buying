import { AdminSectionTabs } from "@/components/admin/AdminSectionTabs";
import { RECIPE_SECTION_TABS } from "@/lib/admin/section-tabs";

export default function AdminRecipesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminSectionTabs label="食譜中心" tabs={RECIPE_SECTION_TABS} />
      {children}
    </>
  );
}
