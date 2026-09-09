import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import {
  getDesktopSectionDefaults,
  type PageLayoutSetting,
} from "@/lib/layout/page-layout-settings";

const DRAFT_PREFIX = "desktop_layout_draft:";
const HISTORY_PREFIX = "desktop_layout_history:";
const MAX_HISTORY = 20;

export type DesktopLayoutDraft = {
  id: string;
  page_key: string;
  version_number: number;
  updated_at: string;
  updated_by: string | null;
  rows: PageLayoutSetting[];
};

function draftKey(pageKey: string) {
  return `${DRAFT_PREFIX}${pageKey}`;
}

function historyKey(pageKey: string) {
  return `${HISTORY_PREFIX}${pageKey}`;
}

function defaultsAsRows(pageKey: string): PageLayoutSetting[] {
  return getDesktopSectionDefaults(pageKey).map((s, i) => ({
    id: `seed-${pageKey}-${s.section_key}-${i}`,
    page_key: pageKey,
    platform: "desktop" as const,
    section_key: s.section_key,
    enabled: true,
    sort_order: s.sort_order,
    layout_type: s.layout_type,
    columns: s.columns,
    display_limit: s.display_limit,
    settings_json: s.settings_json ?? {},
  }));
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
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );
}

export async function loadLiveDesktopLayout(pageKey: string): Promise<PageLayoutSetting[]> {
  if (!isSupabaseConfigured()) return defaultsAsRows(pageKey);
  const admin = createAdminClient();
  const { data } = await admin
    .from("page_layout_settings")
    .select("*")
    .eq("page_key", pageKey)
    .eq("platform", "desktop")
    .order("sort_order", { ascending: true });
  const rows = (data ?? []) as PageLayoutSetting[];
  return rows.length ? rows : defaultsAsRows(pageKey);
}

export async function getDesktopLayoutDraft(
  pageKey: string,
  updatedBy?: string | null
): Promise<DesktopLayoutDraft> {
  const existing = await readSetting<DesktopLayoutDraft>(draftKey(pageKey));
  if (existing?.rows?.length) return existing;

  const live = await loadLiveDesktopLayout(pageKey);
  const history =
    (await readSetting<DesktopLayoutDraft[]>(historyKey(pageKey))) ?? [];
  const maxVer = Math.max(0, ...history.map((h) => h.version_number), 0);
  const draft: DesktopLayoutDraft = {
    id: crypto.randomUUID(),
    page_key: pageKey,
    version_number: maxVer + 1,
    updated_at: new Date().toISOString(),
    updated_by: updatedBy ?? null,
    rows: live,
  };
  await writeSetting(draftKey(pageKey), draft, updatedBy);
  return draft;
}

export async function saveDesktopLayoutDraft(
  pageKey: string,
  rows: PageLayoutSetting[],
  updatedBy?: string | null
): Promise<DesktopLayoutDraft> {
  const prev = await getDesktopLayoutDraft(pageKey, updatedBy);
  const draft: DesktopLayoutDraft = {
    ...prev,
    rows,
    updated_at: new Date().toISOString(),
    updated_by: updatedBy ?? null,
  };
  await writeSetting(draftKey(pageKey), draft, updatedBy);
  return draft;
}

export async function publishDesktopLayoutDraft(
  pageKey: string,
  publishedBy?: string | null
) {
  const draft = await getDesktopLayoutDraft(pageKey, publishedBy);
  if (!isSupabaseConfigured()) {
    return { published: draft, live: draft.rows };
  }

  const admin = createAdminClient();
  for (const row of draft.rows) {
    if (!row.id || String(row.id).startsWith("seed-")) {
      await admin.from("page_layout_settings").upsert(
        {
          page_key: pageKey,
          platform: "desktop",
          section_key: row.section_key,
          enabled: row.enabled,
          sort_order: row.sort_order,
          layout_type: row.layout_type,
          columns: row.columns,
          display_limit: row.display_limit,
          settings_json: row.settings_json ?? {},
        },
        { onConflict: "page_key,platform,section_key" }
      );
      continue;
    }
    await admin
      .from("page_layout_settings")
      .update({
        enabled: row.enabled,
        sort_order: row.sort_order,
        layout_type: row.layout_type,
        columns: row.columns,
        display_limit: row.display_limit,
        settings_json: row.settings_json ?? {},
      })
      .eq("id", row.id)
      .eq("platform", "desktop");
  }

  const history =
    (await readSetting<DesktopLayoutDraft[]>(historyKey(pageKey))) ?? [];
  const published: DesktopLayoutDraft = {
    ...draft,
    updated_at: new Date().toISOString(),
    updated_by: publishedBy ?? null,
  };
  await writeSetting(
    historyKey(pageKey),
    [published, ...history].slice(0, MAX_HISTORY),
    publishedBy
  );

  const nextDraft: DesktopLayoutDraft = {
    id: crypto.randomUUID(),
    page_key: pageKey,
    version_number: draft.version_number + 1,
    updated_at: new Date().toISOString(),
    updated_by: publishedBy ?? null,
    rows: await loadLiveDesktopLayout(pageKey),
  };
  await writeSetting(draftKey(pageKey), nextDraft, publishedBy);

  return { published, live: nextDraft.rows, draft: nextDraft };
}

export async function listDesktopLayoutVersions(pageKey: string) {
  return (await readSetting<DesktopLayoutDraft[]>(historyKey(pageKey))) ?? [];
}

export async function restoreDesktopLayoutVersion(
  pageKey: string,
  versionId: string,
  updatedBy?: string | null
) {
  const history = await listDesktopLayoutVersions(pageKey);
  const found = history.find((h) => h.id === versionId);
  if (!found) throw new Error("找不到版本");
  return saveDesktopLayoutDraft(pageKey, found.rows, updatedBy);
}
