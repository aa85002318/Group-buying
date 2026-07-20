import { redirect } from "next/navigation";
import { APP_ROUTES } from "@/lib/site-links";

/** Legacy route — redirect to new member profile page */
export default function ProfileEditRedirectPage() {
  redirect(APP_ROUTES.memberProfile);
}
