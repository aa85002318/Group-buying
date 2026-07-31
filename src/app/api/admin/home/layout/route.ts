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

    if (action === "rebuild_primary_layout") {
      const { loadLiveBlocks } = await import("@/lib/home/layout-versions");
      const { buildPrimaryHomeLayout } = await import("@/lib/home/blocks");
      const publish = body.publish === true;
      // Prefer current draft configs, fall back to live rows
      const draft = await getDraft();
      const live = await loadLiveBlocks();
      const mergedById = new Map<string, HomepageBlock>();
      for (const b of live) mergedById.set(b.id, b);
      for (const b of draft.blocks_snapshot) mergedById.set(b.id, b);
      const primary = buildPrimaryHomeLayout(Array.from(mergedById.values()));
      const nextDraft = await saveDraft(primary, {
        label: "前台核心版型",
        note: "已依 staging 前台順序重建，僅保留 11 個核心區塊",
        updatedBy: auth!.profile.id,
      });
      if (publish) {
        const result = await publishDraft({
          label: "發布前台核心版型",
          note: "移除舊區塊，對齊目前前台順序",
          publishedBy: auth!.profile.id,
        });
        await logAudit(
          auth!.profile.id,
          "publish",
          "homepage_layout",
          result.published.id,
          null,
          { action: "rebuild_primary_layout", version_number: result.published.version_number },
          request as never
        );
        return NextResponse.json(result);
      }
      await logAudit(
        auth!.profile.id,
        "update",
        "homepage_layout_draft",
        nextDraft.id,
        null,
        { action: "rebuild_primary_layout", block_count: primary.length },
        request as never
      );
      return NextResponse.json({ draft: nextDraft });
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

    if (action === "add_block") {
      const blockKey = String(body.block_key ?? "").trim();
      const { isHomeSectionKey, isSingletonHomeSection } = await import(
        "@/lib/home/section-keys"
      );
      if (!isHomeSectionKey(blockKey)) {
        return NextResponse.json({ error: "未知區塊類型" }, { status: 400 });
      }
      const draft = await getDraft();
      if (
        isSingletonHomeSection(blockKey) &&
        draft.blocks_snapshot.some((b) => b.block_key === blockKey)
      ) {
        return NextResponse.json(
          { error: "此區塊類型最多只能有一個" },
          { status: 400 }
        );
      }
      const { createBlockInstance } = await import("@/lib/home/blocks");
      const { addDraftBlock } = await import("@/lib/home/layout-versions");
      const maxSort = Math.max(0, ...draft.blocks_snapshot.map((b) => b.sort_order ?? 0));
      const label =
        typeof body.instance_label === "string" ? body.instance_label.trim() : "";
      const placement =
        typeof body.placement === "string" ? body.placement.trim() : "";
      const instance = createBlockInstance(blockKey, {
        sortOrder: maxSort + 10,
        instanceLabel: label || null,
        configOverrides:
          blockKey === "banner_strip" && placement
            ? { placement }
            : blockKey === "banner_strip"
              ? { placement: `home_strip_${Date.now().toString(36)}` }
              : undefined,
      });
      if (typeof body.title === "string" && body.title.trim()) {
        instance.title = body.title.trim();
      }
      const next = await addDraftBlock(instance, auth!.profile.id);
      await logAudit(
        auth!.profile.id,
        "create",
        "homepage_layout_draft",
        instance.id,
        null,
        { block_key: blockKey },
        request as never
      );
      return NextResponse.json({ draft: next, block: instance }, { status: 201 });
    }

    if (action === "remove_block") {
      const blockId = String(body.block_id ?? "").trim();
      if (!blockId) {
        return NextResponse.json({ error: "缺少 block_id" }, { status: 400 });
      }
      const { removeDraftBlock } = await import("@/lib/home/layout-versions");
      const draft = await removeDraftBlock(blockId, auth!.profile.id);
      await logAudit(
        auth!.profile.id,
        "delete",
        "homepage_layout_draft",
        blockId,
        null,
        null,
        request as never
      );
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
