import { redirect } from "next/navigation";

/** Legacy path → Desktop pipeline */
export default function AdminPageBuilderLegacyEditorRedirect({
  params,
}: {
  params: { pageId: string };
}) {
  redirect(`/admin/page-builder/desktop/${params.pageId}`);
}
