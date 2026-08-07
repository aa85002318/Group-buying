import { NextResponse } from "next/server";
import { getGroupBuyPageSettings } from "@/lib/group-buy/settings-store";
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
    const { requireAdmin } = await import("@/lib/auth");
    const { error: authError } = await requireAdmin();
    if (authError) return authError;
    const { groupBuyPageVersions } = await import(
      "@/lib/group-buy/page-settings-versions"
    );
    const draft = await groupBuyPageVersions.getDraft();
    return NextResponse.json(
      {
        settings: draft.snapshot,
        preview: "draft",
        draft_version: draft.version_number,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const settings = await getGroupBuyPageSettings();
  return NextResponse.json(
    { settings },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
