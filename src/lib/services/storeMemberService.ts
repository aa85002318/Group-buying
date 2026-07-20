import { createAdminClient } from "@/lib/supabase/admin";

export type StoreMemberInput = {
  phone: string;
  store_member_no?: string | null;
  store_id?: string | null;
  source?: "store" | "import" | "manual" | "other";
  notes?: string | null;
};

export type PhoneMatchHint = {
  matched: boolean;
  online_profile_id: string | null;
  message: string | null;
};

/** Normalize Taiwan-ish phone for storage / match. */
export function normalizePhone(phone: string): string {
  return phone.replace(/\s+/g, "").replace(/^\+886/, "0");
}

/**
 * Check if an online member profile shares this phone.
 * NEVER auto-merges — returns a hint only.
 */
export async function findOnlinePhoneMatch(phone: string): Promise<PhoneMatchHint> {
  const normalized = normalizePhone(phone);
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id, phone")
    .eq("phone", normalized)
    .limit(1)
    .maybeSingle();

  if (data?.id) {
    return {
      matched: true,
      online_profile_id: data.id,
      message: "找到相同電話（線上會員）。不得自動合併，請人工確認。",
    };
  }
  return { matched: false, online_profile_id: null, message: null };
}

export async function createStoreMember(input: StoreMemberInput) {
  const phone = normalizePhone(input.phone);
  const match = await findOnlinePhoneMatch(phone);
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("store_members")
    .insert({
      phone,
      store_member_no: input.store_member_no ?? null,
      store_id: input.store_id ?? null,
      source: input.source ?? "store",
      notes: input.notes ?? null,
      // Hint only — never copy name/email/address
      matched_profile_id: null,
      match_noted_at: match.matched ? new Date().toISOString() : null,
    })
    .select()
    .single();

  return { member: data, error, phoneMatch: match };
}
