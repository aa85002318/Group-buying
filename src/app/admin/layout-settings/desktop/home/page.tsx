import { redirect } from "next/navigation";

/** Classic Desktop home layout → Desktop Page Builder home editor */
export default function AdminDesktopHomeLayoutRedirect() {
  redirect("/admin/page-builder/desktop/home");
}
