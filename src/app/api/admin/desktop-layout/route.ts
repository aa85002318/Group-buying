import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import {
  getDesktopLayoutDraft,
  listDesktopLayoutVersions,
  publishDesktopLayoutDraft,
  restoreDesktopLayoutVersion,
  saveDesktopLayoutDraft,
} from "@/lib/cms/desktop-layout-versions";
import type { PageLayoutSetting } from "@/lib/layout/page-layout-settings";

export async function GET(request: Request) {
  const { error } = await requireContentAdmin();
  if (error) return error;

  const pageKey = new URL(request.url).searchParams.get("page_key") ?? "home";
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ draft: null, versions: [] });
  }

  const [draft, versions] = await Promise.all([
    getDesktopLayoutDraft(pageKey),
    listDesktopLayoutVersions(pageKey),
  ]);

  return NextResponse.json({ draft, versions });
}

export async function PUT(request: Request) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const body = await request.json().catch(() => ({}));
  const pageKey = String(body.page_key ?? "home");
  const rows = body.rows as PageLayoutSetting[] | undefined;
  if (!Array.isArray(rows)) {
    return NextResponse.json({ error: "缺少 rows" }, { status: 400 });
  }

  const draft = await saveDesktopLayoutDraft(pageKey, rows, auth!.profile.id);
  await logAudit(
    auth!.profile.id,
    "update",
    "desktop_layout_draft",
    draft.id,
    null,
    { page_key: pageKey, count: rows.length }
  );
  return NextResponse.json({ draft });
}

export async function POST(request: Request) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const body = await request.json().catch(() => ({}));
  const action = String(body.action ?? "");
  const pageKey = String(body.page_key ?? "home");

  if (action === "publish") {
    const result = await publishDesktopLayoutDraft(pageKey, auth!.profile.id);
    await logAudit(
      auth!.profile.id,
      "publish",
      "desktop_layout",
      result.published.id,
      null,
      { page_key: pageKey, version: result.published.version_number }
    );
    return NextResponse.json(result);
  }

  if (action === "restore") {
    const versionId = String(body.version_id ?? "");
    if (!versionId) {
      return NextResponse.json({ error: "缺少 version_id" }, { status: 400 });
    }
    const draft = await restoreDesktopLayoutVersion(
      pageKey,
      versionId,
      auth!.profile.id
    );
    return NextResponse.json({ draft });
  }

  return NextResponse.json({ error: "未知 action" }, { status: 400 });
}
