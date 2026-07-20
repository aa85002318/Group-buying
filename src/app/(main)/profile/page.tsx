import { redirect } from "next/navigation";
import { APP_ROUTES } from "@/lib/site-links";

export default function ProfileRedirectPage() {
  redirect(APP_ROUTES.member);
}
