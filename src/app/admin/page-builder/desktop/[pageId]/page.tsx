import { CmsCanvasPageLoader } from "@/components/admin/cms/CmsCanvasPageLoader";
import { getPageRegistryEntry } from "@/lib/cms/page-registry";
import { notFound, redirect } from "next/navigation";
import { isPageUnified, pageBuilderHref } from "@/lib/cms/page-builder";

export default function AdminPageBuilderDesktopEditorPage({
  params,
}: {
  params: { pageId: string };
}) {
  const entry = getPageRegistryEntry(params.pageId);
  if (!entry) notFound();
  // Unified pages (home) are edited once for app + website.
  if (isPageUnified(params.pageId)) redirect(pageBuilderHref(params.pageId, "mobile"));

  return (
    <div className="mx-auto w-full max-w-[1800px] px-0 py-1">
      <CmsCanvasPageLoader pageId={params.pageId} platform="desktop" />
    </div>
  );
}
