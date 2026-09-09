import { CmsManagerWithLiveStatus } from "@/components/admin/cms/CmsManager";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function AdminFrontendCmsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-1 py-2 md:px-0">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[#E9EDF2] bg-[#EEF8FC] px-4 py-3">
        <p className="text-sm text-[#153E73]">
          新版雙版型編輯器已上線：左側預覽、右側模組、Desktop｜Mobile 切換。
        </p>
        <Link
          href="/admin/page-builder"
          className={buttonVariants({
            size: "sm",
            className:
              "border-[#FFD454] bg-[#FFD454] text-[#153E73] hover:bg-[#FFD454]/90",
          })}
        >
          開啟 Page Builder
        </Link>
      </div>
      <CmsManagerWithLiveStatus />
    </div>
  );
}
