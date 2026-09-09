import { redirect } from "next/navigation";

export default function AdminFrontendCmsEditorRedirect({
  params,
}: {
  params: { pageId: string };
}) {
  redirect(`/admin/page-builder/desktop/${params.pageId}`);
}
