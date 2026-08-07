/** Generic draft / publish / history for JSON settings stored in site_settings. */

import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";

export type SettingsVersionStatus = "draft" | "scheduled" | "published" | "archived";

export type SettingsVersionMeta<T> = {
  id: string;
  version_number: number;
  status: SettingsVersionStatus;
  label: string | null;
  note: string | null;
  scheduled_at: string | null;
  published_at: string | null;
  published_by: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  snapshot: T;
};

export type SettingsVersionKeys = {
  draftKey: string;
  historyKey: string;
  scheduledKey: string;
};

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

export function createSettingsVersionStore<T>(opts: {
  keys: SettingsVersionKeys;
  loadLive: () => Promise<T>;
  applyLive: (snapshot: T, updatedBy?: string | null) => Promise<void>;
  maxHistory?: number;
  clone?: (value: T) => T;
}) {
  const maxHistory = opts.maxHistory ?? 20;
  const clone = opts.clone ?? ((v: T) => structuredClone(v));

  async function ensureDraft(updatedBy?: string | null): Promise<SettingsVersionMeta<T>> {
    const existing = await readSetting<SettingsVersionMeta<T>>(opts.keys.draftKey);
    if (existing && existing.snapshot != null) return existing;

    const live = await opts.loadLive();
    const history =
      (await readSetting<SettingsVersionMeta<T>[]>(opts.keys.historyKey)) ?? [];
    const maxVer = Math.max(0, ...history.map((h) => h.version_number), 1);
    const draft: SettingsVersionMeta<T> = {
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
      snapshot: clone(live),
    };
    await writeSetting(opts.keys.draftKey, draft, updatedBy);
    return draft;
  }

  async function getDraft(): Promise<SettingsVersionMeta<T>> {
    return ensureDraft();
  }

  async function saveDraft(
    snapshot: T,
    meta?: { label?: string; note?: string; updatedBy?: string | null }
  ): Promise<SettingsVersionMeta<T>> {
    const draft = await ensureDraft(meta?.updatedBy);
    const next: SettingsVersionMeta<T> = {
      ...draft,
      label: meta?.label ?? draft.label,
      note: meta?.note ?? draft.note,
      snapshot: clone(snapshot),
      updated_by: meta?.updatedBy ?? draft.updated_by,
      updated_at: nowIso(),
      status: "draft",
    };
    await writeSetting(opts.keys.draftKey, next, meta?.updatedBy);
    return next;
  }

  async function resetDraftFromLive(updatedBy?: string | null): Promise<SettingsVersionMeta<T>> {
    const live = await opts.loadLive();
    return saveDraft(live, { label: "草稿（已同步線上）", updatedBy });
  }

  async function publishDraft(meta?: {
    label?: string;
    note?: string;
    publishedBy?: string | null;
  }): Promise<{ published: SettingsVersionMeta<T>; draft: SettingsVersionMeta<T> }> {
    const draft = await ensureDraft(meta?.publishedBy);
    await opts.applyLive(draft.snapshot, meta?.publishedBy);

    const published: SettingsVersionMeta<T> = {
      ...draft,
      id: makeId(),
      status: "published",
      label: meta?.label || draft.label || `發布 v${draft.version_number}`,
      note: meta?.note ?? draft.note,
      published_at: nowIso(),
      published_by: meta?.publishedBy ?? null,
      updated_at: nowIso(),
      scheduled_at: null,
    };

    const history =
      (await readSetting<SettingsVersionMeta<T>[]>(opts.keys.historyKey)) ?? [];
    const archivedHistory = history.map((h) =>
      h.status === "published" ? { ...h, status: "archived" as const } : h
    );
    const nextHistory = [published, ...archivedHistory].slice(0, maxHistory);
    await writeSetting(opts.keys.historyKey, nextHistory, meta?.publishedBy);
    await writeSetting(opts.keys.scheduledKey, null, meta?.publishedBy);

    const newDraft: SettingsVersionMeta<T> = {
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
      created_by: meta?.publishedBy ?? null,
      updated_by: meta?.publishedBy ?? null,
    };
    await writeSetting(opts.keys.draftKey, newDraft, meta?.publishedBy);
    return { published, draft: newDraft };
  }

  async function scheduleDraft(args: {
    scheduledAt: string;
    label?: string;
    note?: string;
    updatedBy?: string | null;
  }): Promise<SettingsVersionMeta<T>> {
    const draft = await ensureDraft(args.updatedBy);
    const scheduled: SettingsVersionMeta<T> = {
      ...draft,
      id: makeId(),
      status: "scheduled",
      label: args.label || draft.label || `排程 v${draft.version_number}`,
      note: args.note ?? draft.note,
      scheduled_at: args.scheduledAt,
      updated_by: args.updatedBy ?? null,
      updated_at: nowIso(),
    };
    await writeSetting(opts.keys.scheduledKey, scheduled, args.updatedBy);
    return scheduled;
  }

  async function cancelSchedule(updatedBy?: string | null) {
    await writeSetting(opts.keys.scheduledKey, null, updatedBy);
  }

  async function getScheduled(): Promise<SettingsVersionMeta<T> | null> {
    return readSetting<SettingsVersionMeta<T>>(opts.keys.scheduledKey);
  }

  async function listVersions(): Promise<SettingsVersionMeta<T>[]> {
    const [draft, scheduled, history] = await Promise.all([
      ensureDraft(),
      getScheduled(),
      readSetting<SettingsVersionMeta<T>[]>(opts.keys.historyKey),
    ]);
    const list: SettingsVersionMeta<T>[] = [draft];
    if (scheduled) list.push(scheduled);
    list.push(...(history ?? []));
    return list;
  }

  async function restoreVersion(
    versionId: string,
    updatedBy?: string | null
  ): Promise<SettingsVersionMeta<T>> {
    const versions = await listVersions();
    const target = versions.find((v) => v.id === versionId);
    if (!target) throw new Error("找不到此版本");
    return saveDraft(target.snapshot, {
      label: `還原自 ${target.label || `v${target.version_number}`}`,
      note: `還原自版本 ${target.version_number}`,
      updatedBy,
    });
  }

  /** Auto-publish due scheduled settings without wiping the working draft. */
  async function publishDueScheduled(): Promise<boolean> {
    const scheduled = await getScheduled();
    if (!scheduled?.scheduled_at) return false;
    if (new Date(scheduled.scheduled_at) > new Date()) return false;

    await opts.applyLive(scheduled.snapshot, scheduled.updated_by);

    const published: SettingsVersionMeta<T> = {
      ...scheduled,
      id: makeId(),
      status: "published",
      label: scheduled.label || `排程發布 v${scheduled.version_number}`,
      note: scheduled.note || "排程自動發布",
      published_at: nowIso(),
      published_by: scheduled.updated_by,
      updated_at: nowIso(),
      scheduled_at: null,
    };

    const history =
      (await readSetting<SettingsVersionMeta<T>[]>(opts.keys.historyKey)) ?? [];
    const archivedHistory = history.map((h) =>
      h.status === "published" ? { ...h, status: "archived" as const } : h
    );
    const nextHistory = [published, ...archivedHistory].slice(0, maxHistory);
    await writeSetting(opts.keys.historyKey, nextHistory, scheduled.updated_by);
    await writeSetting(opts.keys.scheduledKey, null, scheduled.updated_by);
    return true;
  }

  return {
    ensureDraft,
    getDraft,
    saveDraft,
    resetDraftFromLive,
    publishDraft,
    scheduleDraft,
    cancelSchedule,
    getScheduled,
    listVersions,
    restoreVersion,
    publishDueScheduled,
  };
}
