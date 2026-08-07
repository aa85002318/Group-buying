import { CmsCanvasPageLoader } from "@/components/admin/cms/CmsCanvasPageLoader";
import { getPageRegistryEntry } from "@/lib/cms/page-registry";
import { notFound } from "next/navigation";

export default function AdminFrontendCmsEditorPage({
  params,
}: {
  params: { pageId: string };
}) {
  const entry = getPageRegistryEntry(params.pageId);
  if (!entry) notFound();

  return (
    <div className="mx-auto max-w-[1600px] px-1 py-2 md:px-0">
      <CmsCanvasPageLoader pageId={params.pageId} />
    </div>
  );
}
