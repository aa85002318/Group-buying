import { notFound } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { RecipeDemoClient } from "@/components/dev/RecipeDemoClient";

export const dynamic = "force-dynamic";

export default async function RecipeDemoPage() {
  const isDev = process.env.NODE_ENV !== "production";
  const auth = await getAuthUser();
  const role = auth?.profile?.role;
  const isContentAdmin = role === "admin" || role === "content_editor";

  if (!isDev && !isContentAdmin) {
    notFound();
  }

  return (
    <RecipeDemoClient
      isDev={isDev}
      canMutate={isContentAdmin}
      userEmail={auth?.user?.email ?? null}
    />
  );
}
