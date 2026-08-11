import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import {
  DEFAULT_FULFILLMENT_SETTINGS,
  type FulfillmentSettings,
} from "./settings";

export async function getFulfillmentSettings(): Promise<FulfillmentSettings> {
  if (!isSupabaseConfigured()) return DEFAULT_FULFILLMENT_SETTINGS;
  const admin = createAdminClient();
  const { data } = await admin
    .from("fulfillment_settings")
    .select("config")
    .eq("settings_key", "default")
    .maybeSingle();
  return {
    ...DEFAULT_FULFILLMENT_SETTINGS,
    ...((data?.config ?? {}) as Partial<FulfillmentSettings>),
  };
}

export async function saveFulfillmentSettings(
  config: Partial<FulfillmentSettings>,
  userId?: string
): Promise<FulfillmentSettings> {
  const next = { ...DEFAULT_FULFILLMENT_SETTINGS, ...config };
  if (!isSupabaseConfigured()) return next;
  const admin = createAdminClient();
  await admin.from("fulfillment_settings").upsert({
    settings_key: "default",
    config: next,
    updated_by: userId ?? null,
    updated_at: new Date().toISOString(),
  });
  return next;
}
