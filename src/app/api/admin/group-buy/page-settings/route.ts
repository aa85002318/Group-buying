import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin, logAudit } from "@/lib/auth";
import {
  mergeGroupBuyPageSettings,
  validateGroupBuyPageSettings,
} from "@/lib/group-buy/page-settings";
import { getGroupBuyPageSettings } from "@/lib/group-buy/settings-store";
import { groupBuyPageVersions } from "@/lib/group-buy/page-settings-versions";

export const dynamic = "force-dynamic";

function toLite(v: {
  id: string;
  version_number: number;
  status: string;
  label: string | null;
  scheduled_at: string | null;
  published_at: string | null;
  updated_at: string;
}) {
  return {
    id: v.id,
    version_number: v.version_number,
    status: v.status,
    label: v.label,
    scheduled_at: v.scheduled_at,
    published_at: v.published_at,
    updated_at: v.updated_at,
  };
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const [draft, scheduled, versions, live] = await Promise.all([
    groupBuyPageVersions.getDraft(),
    groupBuyPageVersions.getScheduled(),
    groupBuyPageVersions.listVersions(),
    getGroupBuyPageSettings(),
  ]);

  return NextResponse.json({
    settings: draft.snapshot,
    live,
    draft: toLite(draft),
    scheduled: scheduled ? toLite(scheduled) : null,
    versions: versions.map(toLite),
  });
}

/** Save draft only — does not affect live storefront. */
export async function PUT(request: Request) {
  const { error: authError, auth } = await requireAdmin();
  if (authError) return authError;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "無效的請求內容" }, { status: 400 });
  }

  const settings = mergeGroupBuyPageSettings(body.settings ?? body);
  const validationError = validateGroupBuyPageSettings(settings);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const draft = await groupBuyPageVersions.saveDraft(settings, {
    updatedBy: auth!.profile.id,
  });

  await logAudit(
    auth!.profile.id,
    "update",
    "group_buy_page_draft",
    draft.id,
    null,
    { version_number: draft.version_number, title: settings.title },
    request as never
  );

  return NextResponse.json({
    settings: draft.snapshot,
    draft: toLite(draft),
    message: "草稿已儲存（尚未上線）",
  });
}

export async function POST(request: Request) {
  const { error: authError, auth } = await requireAdmin();
  if (authError) return authError;

  const body = await request.json().catch(() => ({}));
  const action = String(body.action ?? "");

  try {
    if (action === "publish") {
      const result = await groupBuyPageVersions.publishDraft({
        label: typeof body.label === "string" ? body.label : undefined,
        note: typeof body.note === "string" ? body.note : undefined,
        publishedBy: auth!.profile.id,
      });
      try {
        revalidatePath("/group-buy");
        revalidatePath("/admin/group-buy/settings");
      } catch {
        /* ignore */
      }
      await logAudit(
        auth!.profile.id,
        "publish",
        "group_buy_page_settings",
        result.published.id,
        null,
        { version_number: result.published.version_number },
        request as never
      );
      return NextResponse.json({
        published: toLite(result.published),
        draft: toLite(result.draft),
        settings: result.draft.snapshot,
      });
    }

    if (action === "schedule") {
      const scheduledAt = String(body.scheduled_at ?? "").trim();
      if (!scheduledAt) {
        return NextResponse.json({ error: "缺少 scheduled_at" }, { status: 400 });
      }
      const when = new Date(scheduledAt);
      if (Number.isNaN(when.getTime()) || when <= new Date()) {
        return NextResponse.json({ error: "排程時間必須晚於現在" }, { status: 400 });
      }
      const scheduled = await groupBuyPageVersions.scheduleDraft({
        scheduledAt: when.toISOString(),
        label: typeof body.label === "string" ? body.label : undefined,
        note: typeof body.note === "string" ? body.note : undefined,
        updatedBy: auth!.profile.id,
      });
      await logAudit(
        auth!.profile.id,
        "schedule",
        "group_buy_page_settings",
        scheduled.id,
        null,
        { scheduled_at: scheduled.scheduled_at },
        request as never
      );
      return NextResponse.json({ scheduled: toLite(scheduled) });
    }

    if (action === "cancel_schedule") {
      await groupBuyPageVersions.cancelSchedule(auth!.profile.id);
      return NextResponse.json({ ok: true });
    }

    if (action === "reset_draft_from_live") {
      const draft = await groupBuyPageVersions.resetDraftFromLive(auth!.profile.id);
      return NextResponse.json({ draft: toLite(draft), settings: draft.snapshot });
    }

    if (action === "restore") {
      const versionId = String(body.version_id ?? "").trim();
      if (!versionId) {
        return NextResponse.json({ error: "缺少 version_id" }, { status: 400 });
      }
      const draft = await groupBuyPageVersions.restoreVersion(versionId, auth!.profile.id);
      return NextResponse.json({ draft: toLite(draft), settings: draft.snapshot });
    }

    return NextResponse.json({ error: "未知 action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "操作失敗" },
      { status: 500 }
    );
  }
}
