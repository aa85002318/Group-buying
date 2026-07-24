import { redirect } from "next/navigation";

/** Prefer plural /admin/store/batches (Store Ops V2). */
export default function StoreBatchLegacyRedirectPage() {
  redirect("/admin/store/batches");
}
