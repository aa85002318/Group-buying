import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import type { HomepageBlock } from "@/lib/types/database";

export type LayoutVersionStatus = "draft" | "scheduled" | "published" | "archived";

export type LayoutVersionMeta = {
  id: string;
  version_number: number;
  status: LayoutVersionStatus;
  label: string | null;
  note: string | null;
  scheduled_at: string | null;
  published_at: string | null;
  published_by: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  blocks_snapshot: HomepageBlock[];
};

const DRAFT_KEY = "homepage_layout_draft";
const HISTORY_KEY = "homepage_layout_history";
const SCHEDULED_KEY = "homepage_layout_scheduled";
const MAX_HISTORY = 20;

function nowIso() {
  return new Date().toISOString();
}

function makeId() {
  return crypto.randomUUID();
}

async function readSetting<T>(key: string): Promise<T | null> {
  if (!isSupabaseConfigured()) return null;
  const admin = createAdminClient();
  const { data } = await admin.from("site_settings").select("value").eq("key", key).maybeSingle();
  return (data?.value as T) ?? null;
}

async function writeSetting(key: string, value: unknown, updatedBy?: string | null) {
  if (!isSupabaseConfigured()) return;
  const admin = createAdminClient();
  await admin.from("site_settings").upsert(
    {
      key,
      value,
      updated_by: updatedBy ?? null,
      updated_at: nowIso(),
    },
    { onConflict: "key" }
  );
}

export async function loadLiveBlocks(): Promise<HomepageBlock[]> {
  if (!isSupabaseConfigured()) return [];
  const admin = createAdminClient();
  const { data } = await admin.from("homepage_blocks").select("*").order("sort_order");
  return (data ?? []) as HomepageBlock[];
}

export async function ensureDraft(updatedBy?: string | null): Promise<LayoutVersionMeta> {
  const existing = await readSetting<LayoutVersionMeta>(DRAFT_KEY);
  if (existing?.blocks_snapshot?.length) return existing;

  const live = await loadLiveBlocks();
  const history = (await readSetting<LayoutVersionMeta[]>(HISTORY_KEY)) ?? [];
  const maxVer = Math.max(0, ...history.map((h) => h.version_number), 1);
  const draft: LayoutVersionMeta = {
    id: makeId(),
    version_number: maxVer + 1,
    status: "draft",
    label: "草稿",
    note: null,
    scheduled_at: null,
    published_at: null,
    published_by: null,
    created_by: updatedBy ?? null,
    updated_by: updatedBy ?? null,
    created_at: nowIso(),
    updated_at: nowIso(),
    blocks_snapshot: live,
  };
  await writeSetting(DRAFT_KEY, draft, updatedBy);
  return draft;
}

export async function getDraft(): Promise<LayoutVersionMeta> {
  return ensureDraft();
}

export async function saveDraft(
  blocks: HomepageBlock[],
  opts?: { label?: string; note?: string; updatedBy?: string | null }
): Promise<LayoutVersionMeta> {
  const draft = await ensureDraft(opts?.updatedBy);
  const next: LayoutVersionMeta = {
    ...draft,
    label: opts?.label ?? draft.label,
    note: opts?.note ?? draft.note,
    blocks_snapshot: blocks,
    updated_by: opts?.updatedBy ?? draft.updated_by,
    updated_at: nowIso(),
    status: "draft",
  };
  await writeSetting(DRAFT_KEY, next, opts?.updatedBy);
  return next;
}

export async function patchDraftBlock(
  blockId: string,
  updates: Record<string, unknown>,
  updatedBy?: string | null
): Promise<LayoutVersionMeta> {
  const draft = await ensureDraft(updatedBy);
  const blocks = draft.blocks_snapshot.map((b) =>
    b.id === blockId ? ({ ...b, ...updates, updated_at: nowIso() } as HomepageBlock) : b
  );
  return saveDraft(blocks, { updatedBy });
}

async function applyBlocksToLive(blocks: HomepageBlock[]) {
  if (!isSupabaseConfigured()) return;
  const admin = createAdminClient();
  for (const block of blocks) {
    const { id, ...rest } = block;
    await admin.from("homepage_blocks").update(rest).eq("id", id);
  }
}

export async function publishDraft(opts?: {
  label?: string;
  note?: string;
  publishedBy?: string | null;
}): Promise<{ published: LayoutVersionMeta; draft: LayoutVersionMeta }> {
  const draft = await ensureDraft(opts?.publishedBy);
  await applyBlocksToLive(draft.blocks_snapshot);

  const published: LayoutVersionMeta = {
    ...draft,
    id: makeId(),
    status: "published",
    label: opts?.label || draft.label || `發布 v${draft.version_number}`,
    note: opts?.note ?? draft.note,
    published_at: nowIso(),
    published_by: opts?.publishedBy ?? null,
    updated_at: nowIso(),
    scheduled_at: null,
  };

  const history = (await readSetting<LayoutVersionMeta[]>(HISTORY_KEY)) ?? [];
  const archivedHistory = history.map((h) =>
    h.status === "published" ? { ...h, status: "archived" as const } : h
  );
  const nextHistory = [published, ...archivedHistory].slice(0, MAX_HISTORY);
  await writeSetting(HISTORY_KEY, nextHistory, opts?.publishedBy);

  // Clear scheduled if any
  await writeSetting(SCHEDULED_KEY, null, opts?.publishedBy);

  const newDraft: LayoutVersionMeta = {
    ...published,
    id: makeId(),
    version_number: published.version_number + 1,
    status: "draft",
    label: "草稿",
    note: null,
    published_at: null,
    published_by: null,
    scheduled_at: null,
    created_at: nowIso(),
    updated_at: nowIso(),
    created_by: opts?.publishedBy ?? null,
    updated_by: opts?.publishedBy ?? null,
  };
  await writeSetting(DRAFT_KEY, newDraft, opts?.publishedBy);
  return { published, draft: newDraft };
}

export async function scheduleDraft(opts: {
  scheduledAt: string;
  label?: string;
  note?: string;
  updatedBy?: string | null;
}): Promise<LayoutVersionMeta> {
  const draft = await ensureDraft(opts.updatedBy);
  const scheduled: LayoutVersionMeta = {
    ...draft,
    id: makeId(),
    status: "scheduled",
    label: opts.label || draft.label || `排程 v${draft.version_number}`,
    note: opts.note ?? draft.note,
    scheduled_at: opts.scheduledAt,
    updated_by: opts.updatedBy ?? null,
    updated_at: nowIso(),
  };
  await writeSetting(SCHEDULED_KEY, scheduled, opts.updatedBy);
  return scheduled;
}

export async function cancelSchedule(updatedBy?: string | null) {
  await writeSetting(SCHEDULED_KEY, null, updatedBy);
}

export async function getScheduled(): Promise<LayoutVersionMeta | null> {
  return readSetting<LayoutVersionMeta>(SCHEDULED_KEY);
}

export async function listVersions(): Promise<LayoutVersionMeta[]> {
  const [draft, scheduled, history] = await Promise.all([
    ensureDraft(),
    getScheduled(),
    readSetting<LayoutVersionMeta[]>(HISTORY_KEY),
  ]);
  const list: LayoutVersionMeta[] = [draft];
  if (scheduled) list.push(scheduled);
  list.push(...(history ?? []));
  return list;
}

export async function restoreVersion(
  versionId: string,
  updatedBy?: string | null
): Promise<LayoutVersionMeta> {
  const versions = await listVersions();
  const target = versions.find((v) => v.id === versionId);
  if (!target) throw new Error("找不到此版本");

  const draft = await ensureDraft(updatedBy);
  const restored: LayoutVersionMeta = {
    ...draft,
    blocks_snapshot: target.blocks_snapshot,
    label: `還原自 ${target.label || `v${target.version_number}`}`,
    note: `還原自版本 ${target.version_number}`,
    updated_by: updatedBy ?? null,
    updated_at: nowIso(),
    status: "draft",
  };
  await writeSetting(DRAFT_KEY, restored, updatedBy);
  return restored;
}

/** Auto-publish due scheduled layouts (call from public CMS GET). */
export async function publishDueScheduled(): Promise<boolean> {
  const scheduled = await getScheduled();
  if (!scheduled?.scheduled_at) return false;
  if (new Date(scheduled.scheduled_at) > new Date()) return false;

  await writeSetting(DRAFT_KEY, { ...scheduled, status: "draft" }, scheduled.updated_by);
  await publishDraft({
    label: scheduled.label || undefined,
    note: scheduled.note || "排程自動發布",
    publishedBy: scheduled.updated_by,
  });
  return true;
}
