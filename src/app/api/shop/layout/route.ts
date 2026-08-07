import { NextResponse } from "next/server";
import { getShopLayoutSettings } from "@/lib/shop/layout-store";
import { publishAllDueCmsSchedules } from "@/lib/cms/publish-due";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const preview = new URL(request.url).searchParams.get("preview");

  if (preview !== "draft") {
    try {
      await publishAllDueCmsSchedules();
    } catch {
      /* non-fatal */
    }
  }

  if (preview === "draft") {
    const { requireContentAdmin } = await import("@/lib/auth");
    const { error: authError } = await requireContentAdmin();
    if (authError) return authError;
    const { shopLayoutVersions } = await import("@/lib/shop/layout-versions");
    const draft = await shopLayoutVersions.getDraft();
    return NextResponse.json(
      {
        settings: draft.snapshot,
        preview: "draft",
        draft_version: draft.version_number,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const settings = await getShopLayoutSettings();
  return NextResponse.json(
    { settings },
    { headers: { "Cache-Control": "no-store" } }
  );
}
