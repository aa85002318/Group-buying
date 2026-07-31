import { redirect } from "next/navigation";

/** Hero editing is embedded in 首頁 CMS. */
export default function BrandHeroesRedirect() {
  redirect("/admin/home?section=hero");
}
