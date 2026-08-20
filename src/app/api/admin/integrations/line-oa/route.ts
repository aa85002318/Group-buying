import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import {
  getLineOaSettings,
  saveLineOaSettings,
  toLineOaPublicView,
  type LineOaPatch,
} from "@/lib/line/settings";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const settings = await getLineOaSettings();
  return NextResponse.json(toLineOaPublicView(settings));
}

export async function PATCH(request: Request) {
  const { error, auth } = await requireAdmin();
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const patch: LineOaPatch = {};
  if (typeof body.enabled === "boolean") patch.enabled = body.enabled;
  if (typeof body.channelId === "string") patch.channelId = body.channelId;
  if (typeof body.channelSecret === "string") patch.channelSecret = body.channelSecret;
  if (typeof body.channelAccessToken === "string") {
    patch.channelAccessToken = body.channelAccessToken;
  }
  if (typeof body.botBasicId === "string") patch.botBasicId = body.botBasicId;
  if (typeof body.adminNotes === "string") patch.adminNotes = body.adminNotes;

  try {
    const saved = await saveLineOaSettings(patch);
    await logAudit(auth!.user.id, "line_oa_settings_update", "line_oa_settings", "main", {
      enabled: saved.enabled,
    });
    return NextResponse.json(toLineOaPublicView(saved));
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "儲存失敗" },
      { status: 500 }
    );
  }
}
