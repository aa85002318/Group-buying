import { redirect } from "next/navigation";

export default function StoreSuppliersRedirectPage() {
  redirect("/admin/suppliers");
}
