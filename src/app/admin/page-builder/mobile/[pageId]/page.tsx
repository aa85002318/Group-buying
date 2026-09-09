import { CmsCanvasPageLoader } from "@/components/admin/cms/CmsCanvasPageLoader";
import { getPageRegistryEntry } from "@/lib/cms/page-registry";
import { notFound } from "next/navigation";

export default function AdminPageBuilderMobileEditorPage({
  params,
}: {
  params: { pageId: string };
}) {
  const entry = getPageRegistryEntry(params.pageId);
  if (!entry) notFound();

  return (
    <div className="mx-auto w-full max-w-[1800px] px-0 py-1">
      <CmsCanvasPageLoader pageId={params.pageId} platform="mobile" />
    </div>
  );
}
