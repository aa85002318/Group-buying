import { redirect } from "next/navigation";

/** Brand home-layout merged into 首頁 CMS. */
export default function BrandHomeLayoutRedirect() {
  redirect("/admin/home");
}
