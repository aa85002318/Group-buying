import { permanentRedirect } from "next/navigation";
import { APP_ROUTES } from "@/lib/site-links";

export default function AiToolsRedirect() {
  permanentRedirect(APP_ROUTES.ai);
}
