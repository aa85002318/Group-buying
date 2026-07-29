import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import {
  cancelSchedule,
  getDraft,
  getScheduled,
  listVersions,
  publishDraft,
  restoreVersion,
  saveDraft,
  scheduleDraft,
  type LayoutVersionMeta,
} from "@/lib/home/layout-versions";
import type { HomepageBlock } from "@/lib/types/database";

export async function GET() {
  const { error: authError } = await requireContentAdmin();
  if (authError) return authError;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      draft: null,
      scheduled: null,
      versions: [],
    });
  }

  const [draft, scheduled, versions] = await Promise.all([
    getDraft(),
    getScheduled(),
    listVersions(),
  ]);

  return NextResponse.json({ draft, scheduled, versions });
}

export async function PUT(request: Request) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const body = await request.json();
  const blocks = body.blocks as HomepageBlock[] | undefined;
  if (!Array.isArray(blocks)) {
    return NextResponse.json({ error: "缺少 blocks" }, { status: 400 });
  }

  const draft = await saveDraft(blocks, {
    label: typeof body.label === "string" ? body.label : undefined,
    note: typeof body.note === "string" ? body.note : undefined,
    updatedBy: auth!.profile.id,
  });

  await logAudit(
    auth!.profile.id,
    "update",
    "homepage_layout_draft",
    draft.id,
    null,
    { version_number: draft.version_number, block_count: blocks.length },
    request as never
  );

  return NextResponse.json({ draft });
}

export async function POST(request: Request) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const body = await request.json();
  const action = String(body.action ?? "");

  try {
    if (action === "publish") {
      const result = await publishDraft({
        label: typeof body.label === "string" ? body.label : undefined,
        note: typeof body.note === "string" ? body.note : undefined,
        publishedBy: auth!.profile.id,
      });
      await logAudit(
        auth!.profile.id,
        "publish",
        "homepage_layout",
        result.published.id,
        null,
        { version_number: result.published.version_number },
        request as never
      );
      return NextResponse.json(result);
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
      const scheduled = await scheduleDraft({
        scheduledAt: when.toISOString(),
        label: typeof body.label === "string" ? body.label : undefined,
        note: typeof body.note === "string" ? body.note : undefined,
        updatedBy: auth!.profile.id,
      });
      await logAudit(
        auth!.profile.id,
        "schedule",
        "homepage_layout",
        scheduled.id,
        null,
        { scheduled_at: scheduled.scheduled_at },
        request as never
      );
      return NextResponse.json({ scheduled });
    }

    if (action === "cancel_schedule") {
      await cancelSchedule(auth!.profile.id);
      return NextResponse.json({ ok: true });
    }

    if (action === "restore") {
      const versionId = String(body.version_id ?? "").trim();
      if (!versionId) {
        return NextResponse.json({ error: "缺少 version_id" }, { status: 400 });
      }
      const draft = await restoreVersion(versionId, auth!.profile.id);
      await logAudit(
        auth!.profile.id,
        "restore",
        "homepage_layout",
        draft.id,
        null,
        { restored_from: versionId },
        request as never
      );
      return NextResponse.json({ draft });
    }

    if (action === "reset_draft_from_live") {
      const { loadLiveBlocks } = await import("@/lib/home/layout-versions");
      const live = await loadLiveBlocks();
      const draft = await saveDraft(live, {
        label: "從線上還原草稿",
        note: "已用目前線上版覆蓋草稿",
        updatedBy: auth!.profile.id,
      });
      return NextResponse.json({ draft });
    }

    return NextResponse.json({ error: "未知 action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "操作失敗" },
      { status: 500 }
    );
  }
}

export type { LayoutVersionMeta };
