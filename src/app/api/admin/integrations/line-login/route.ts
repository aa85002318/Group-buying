import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import {
  getLineLoginSettings,
  saveLineLoginSettings,
  toLineLoginPublicView,
  type LineLoginPatch,
} from "@/lib/line/settings";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const settings = await getLineLoginSettings();
  return NextResponse.json(toLineLoginPublicView(settings));
}

export async function PATCH(request: Request) {
  const { error, auth } = await requireAdmin();
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const patch: LineLoginPatch = {};
  if (typeof body.enabled === "boolean") patch.enabled = body.enabled;
  if (typeof body.channelId === "string") patch.channelId = body.channelId;
  if (typeof body.channelSecret === "string") patch.channelSecret = body.channelSecret;
  if (typeof body.liffId === "string") patch.liffId = body.liffId;
  if (typeof body.adminNotes === "string") patch.adminNotes = body.adminNotes;

  try {
    const saved = await saveLineLoginSettings(patch);
    await logAudit(auth!.user.id, "line_login_settings_update", "line_login_settings", "main", {
      enabled: saved.enabled,
    });
    return NextResponse.json(toLineLoginPublicView(saved));
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "儲存失敗" },
      { status: 500 }
    );
  }
}
