import { redirect } from "next/navigation";
import { APP_ROUTES } from "@/lib/site-links";

export default function MemberStoresRedirectPage() {
  redirect(APP_ROUTES.stores);
}
