import { CmsManagerWithLiveStatus } from "@/components/admin/cms/CmsManager";

export default function AdminFrontendCmsPage() {
  return (
    <div className="mx-auto max-w-6xl px-1 py-2 md:px-0">
      <CmsManagerWithLiveStatus />
    </div>
  );
}
