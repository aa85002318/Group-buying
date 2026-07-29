import { redirect } from "next/navigation";

/** Spec path: /admin/navigation → existing side-menu CMS */
export default function AdminNavigationAlias() {
  redirect("/admin/side-menu");
}
