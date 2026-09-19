import { redirect } from "next/navigation";

/** Platform hubs were merged into the single page list at /admin/page-builder. */
export default function PageBuilderPlatformHubRedirect() {
  redirect("/admin/page-builder");
}
