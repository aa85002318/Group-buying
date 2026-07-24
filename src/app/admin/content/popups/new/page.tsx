import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { HomepagePopupForm } from "@/components/admin/HomepagePopupForm";

export default function AdminPopupNewPage() {
  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="新增首頁彈跳公告"
        description="上傳圖片、設定連結與顯示期間後即可啟用。"
      />
      <HomepagePopupForm />
    </div>
  );
}
