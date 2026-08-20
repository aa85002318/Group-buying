/** LINE Login + Official Account (私域) integration settings. */

import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import { getSiteUrl } from "@/lib/env";

export type LineLoginSettings = {
  enabled: boolean;
  channelId: string;
  channelSecret: string;
  liffId: string;
  adminNotes: string;
};

export type LineOaSettings = {
  enabled: boolean;
  channelId: string;
  channelSecret: string;
  channelAccessToken: string;
  botBasicId: string;
  adminNotes: string;
};

export const DEFAULT_LINE_LOGIN: LineLoginSettings = {
  enabled: false,
  channelId: "",
  channelSecret: "",
  liffId: "",
  adminNotes: "",
};

export const DEFAULT_LINE_OA: LineOaSettings = {
  enabled: false,
  channelId: "",
  channelSecret: "",
  channelAccessToken: "",
  botBasicId: "",
  adminNotes: "",
};

function maskSecret(value: string): string {
  const v = value.trim();
  if (!v) return "（尚未設定）";
  if (v.length <= 4) return "••••";
  return `${"•".repeat(Math.min(12, v.length - 4))}${v.slice(-4)}`;
}

export function lineLoginCallbackUrl(baseUrl = getSiteUrl()) {
  return `${baseUrl.replace(/\/$/, "")}/auth/callback/line`;
}

export function lineOaWebhookUrl(baseUrl = getSiteUrl()) {
  return `${baseUrl.replace(/\/$/, "")}/api/line/webhook`;
}

function rowToLogin(row: Record<string, unknown> | null | undefined): LineLoginSettings {
  if (!row) return { ...DEFAULT_LINE_LOGIN };
  return {
    enabled: Boolean(row.enabled),
    channelId: String(row.channel_id ?? ""),
    channelSecret: String(row.channel_secret ?? ""),
    liffId: String(row.liff_id ?? ""),
    adminNotes: String(row.admin_notes ?? ""),
  };
}

function rowToOa(row: Record<string, unknown> | null | undefined): LineOaSettings {
  if (!row) return { ...DEFAULT_LINE_OA };
  return {
    enabled: Boolean(row.enabled),
    channelId: String(row.channel_id ?? ""),
    channelSecret: String(row.channel_secret ?? ""),
    channelAccessToken: String(row.channel_access_token ?? ""),
    botBasicId: String(row.bot_basic_id ?? ""),
    adminNotes: String(row.admin_notes ?? ""),
  };
}

export function toLineLoginPublicView(settings: LineLoginSettings) {
  return {
    enabled: settings.enabled,
    channelId: settings.channelId,
    channelSecretMasked: maskSecret(settings.channelSecret),
    channelSecretConfigured: Boolean(settings.channelSecret.trim()),
    liffId: settings.liffId,
    adminNotes: settings.adminNotes,
    callbackUrl: lineLoginCallbackUrl(),
  };
}

export function toLineOaPublicView(settings: LineOaSettings) {
  return {
    enabled: settings.enabled,
    channelId: settings.channelId,
    channelSecretMasked: maskSecret(settings.channelSecret),
    channelSecretConfigured: Boolean(settings.channelSecret.trim()),
    channelAccessTokenMasked: maskSecret(settings.channelAccessToken),
    channelAccessTokenConfigured: Boolean(settings.channelAccessToken.trim()),
    botBasicId: settings.botBasicId,
    adminNotes: settings.adminNotes,
    webhookUrl: lineOaWebhookUrl(),
  };
}

export async function getLineLoginSettings(): Promise<LineLoginSettings> {
  if (!isSupabaseConfigured()) return { ...DEFAULT_LINE_LOGIN };
  const admin = createAdminClient();
  const { data } = await admin
    .from("line_login_settings")
    .select("*")
    .eq("singleton_key", "main")
    .maybeSingle();
  return rowToLogin(data as Record<string, unknown> | null);
}

export async function getLineOaSettings(): Promise<LineOaSettings> {
  if (!isSupabaseConfigured()) return { ...DEFAULT_LINE_OA };
  const admin = createAdminClient();
  const { data } = await admin
    .from("line_oa_settings")
    .select("*")
    .eq("singleton_key", "main")
    .maybeSingle();
  return rowToOa(data as Record<string, unknown> | null);
}

export type LineLoginPatch = Partial<LineLoginSettings>;
export type LineOaPatch = Partial<LineOaSettings>;

export async function saveLineLoginSettings(patch: LineLoginPatch): Promise<LineLoginSettings> {
  const current = await getLineLoginSettings();
  const next: LineLoginSettings = {
    enabled: patch.enabled ?? current.enabled,
    channelId: patch.channelId ?? current.channelId,
    channelSecret:
      patch.channelSecret !== undefined && patch.channelSecret !== ""
        ? patch.channelSecret
        : current.channelSecret,
    liffId: patch.liffId ?? current.liffId,
    adminNotes: patch.adminNotes ?? current.adminNotes,
  };
  const admin = createAdminClient();
  const { error } = await admin.from("line_login_settings").upsert({
    singleton_key: "main",
    enabled: next.enabled,
    channel_id: next.channelId,
    channel_secret: next.channelSecret,
    liff_id: next.liffId,
    admin_notes: next.adminNotes,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  return next;
}

export async function saveLineOaSettings(patch: LineOaPatch): Promise<LineOaSettings> {
  const current = await getLineOaSettings();
  const next: LineOaSettings = {
    enabled: patch.enabled ?? current.enabled,
    channelId: patch.channelId ?? current.channelId,
    channelSecret:
      patch.channelSecret !== undefined && patch.channelSecret !== ""
        ? patch.channelSecret
        : current.channelSecret,
    channelAccessToken:
      patch.channelAccessToken !== undefined && patch.channelAccessToken !== ""
        ? patch.channelAccessToken
        : current.channelAccessToken,
    botBasicId: patch.botBasicId ?? current.botBasicId,
    adminNotes: patch.adminNotes ?? current.adminNotes,
  };
  const admin = createAdminClient();
  const { error } = await admin.from("line_oa_settings").upsert({
    singleton_key: "main",
    enabled: next.enabled,
    channel_id: next.channelId,
    channel_secret: next.channelSecret,
    channel_access_token: next.channelAccessToken,
    bot_basic_id: next.botBasicId,
    admin_notes: next.adminNotes,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  return next;
}
