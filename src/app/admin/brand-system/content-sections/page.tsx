import { redirect } from "next/navigation";

/** Brand content-sections merged into 首頁 CMS. */
export default function BrandContentSectionsRedirect() {
  redirect("/admin/home");
}
