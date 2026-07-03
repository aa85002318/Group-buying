import { redirect } from "next/navigation";
import { APP_ROUTES } from "@/lib/site-links";

export default function StaffHomePage() {
  redirect(APP_ROUTES.staffPickupScan);
}
