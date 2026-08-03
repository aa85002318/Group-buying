import { redirect } from "next/navigation";

/** Store map page removed — redirect to stores list. */
export default function StoreMapRedirectPage() {
  redirect("/stores");
}
