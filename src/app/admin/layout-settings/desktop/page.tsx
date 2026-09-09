import { redirect } from "next/navigation";

/** Classic Desktop layout hub → unified Desktop Page Builder */
export default function AdminDesktopLayoutIndexRedirect() {
  redirect("/admin/page-builder/desktop");
}
