import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isValidBirthday,
  isValidTaiwanPhone,
  memberCodeFromPhone,
  normalizePhone,
} from "@/lib/validation/customer";

export type ProfilePatchInput = {
  full_name?: string;
  phone?: string;
  birthday?: string;
  email?: string;
};

export type ProfilePatchResult =
  | { ok: true; updates: Record<string, string> }
  | { ok: false; error: string; status?: number };

export function buildProfileUpdates(input: ProfilePatchInput): ProfilePatchResult {
  const updates: Record<string, string> = {};

  if (input.full_name !== undefined) {
    const name = input.full_name.trim();
    if (!name) return { ok: false, error: "姓名不可為空", status: 400 };
    updates.full_name = name;
  }

  if (input.phone !== undefined) {
    if (!isValidTaiwanPhone(input.phone)) {
      return { ok: false, error: "請輸入有效的手機號碼（09 開頭，共 10 碼）", status: 400 };
    }
    const phone = normalizePhone(input.phone);
    updates.phone = phone;
    updates.member_code = memberCodeFromPhone(phone);
  }

  if (input.birthday !== undefined) {
    if (!isValidBirthday(input.birthday)) {
      return { ok: false, error: "請輸入有效的生日", status: 400 };
    }
    updates.birthday = input.birthday;
  }

  if (input.email !== undefined) {
    const email = input.email.trim();
    if (!email || !email.includes("@")) {
      return { ok: false, error: "請輸入有效的 Email", status: 400 };
    }
    updates.email = email;
  }

  if (Object.keys(updates).length === 0) {
    return { ok: false, error: "沒有可更新的欄位", status: 400 };
  }

  return { ok: true, updates };
}

export async function isPhoneTaken(
  client: SupabaseClient,
  phone: string,
  excludeUserId?: string
): Promise<boolean> {
  const normalized = normalizePhone(phone);
  for (const column of ["member_code", "phone"] as const) {
    const { data } = await client.from("profiles").select("id").eq(column, normalized).maybeSingle();
    if (data && data.id !== excludeUserId) return true;
  }
  return false;
}
