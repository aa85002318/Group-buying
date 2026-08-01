import { redirect } from "next/navigation";

/** Design link target — reuse support hub for order guide content. */
export default function HelpOrderGuidePage() {
  redirect("/support");
}
