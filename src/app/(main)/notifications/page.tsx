import { permanentRedirect } from "next/navigation";
import { APP_ROUTES } from "@/lib/site-links";

export default function NotificationsRedirect() {
  permanentRedirect(APP_ROUTES.memberNotifications);
}
