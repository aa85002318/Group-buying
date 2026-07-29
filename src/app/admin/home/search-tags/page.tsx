import { redirect } from "next/navigation";

/** Deep-link alias → expand section on homepage CMS hub */
export default function AdminHomeSearchTagsPage() {
  redirect("/admin/home?section=hot_searches");
}
