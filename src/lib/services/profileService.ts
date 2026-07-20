import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isValidBirthday,
  isValidTaiwanPhone,
  memberCodeFromPhone,
  normalizePhone,
} from "@/lib/validation/customer";

export type ProfileGender = "female" | "male" | "other" | "prefer_not_to_say";

export type ProfilePatchInput = {
  full_name?: string;
  phone?: string;
  birthday?: string | null;
  email?: string;
  gender?: ProfileGender | "" | null;
  city?: string | null;
  district?: string | null;
  contact_address?: string | null;
};

export type ProfilePatchResult =
  | { ok: true; updates: Record<string, string | null> }
  | { ok: false; error: string; status?: number };

const GENDERS: ProfileGender[] = ["female", "male", "other", "prefer_not_to_say"];

export function buildProfileUpdates(input: ProfilePatchInput): ProfilePatchResult {
  const updates: Record<string, string | null> = {};

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
    if (input.birthday === null || input.birthday === "") {
      updates.birthday = null;
    } else if (!isValidBirthday(input.birthday)) {
      return { ok: false, error: "請輸入有效的生日", status: 400 };
    } else {
      updates.birthday = input.birthday;
    }
  }

  if (input.email !== undefined) {
    const email = input.email.trim();
    if (!email || !email.includes("@")) {
      return { ok: false, error: "請輸入有效的 Email", status: 400 };
    }
    updates.email = email;
  }

  if (input.gender !== undefined) {
    if (input.gender === null || input.gender === "") {
      updates.gender = null;
    } else if (!GENDERS.includes(input.gender as ProfileGender)) {
      return { ok: false, error: "請選擇有效的性別", status: 400 };
    } else {
      updates.gender = input.gender;
    }
  }

  if (input.city !== undefined) {
    updates.city = input.city?.trim() || null;
  }

  if (input.district !== undefined) {
    updates.district = input.district?.trim() || null;
  }

  if (input.contact_address !== undefined) {
    updates.contact_address = input.contact_address?.trim() || null;
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

export function maskPhone(phone: string | null | undefined): string {
  if (!phone || phone.length < 7) return phone ?? "—";
  return `${phone.slice(0, 4)}***${phone.slice(-3)}`;
}

export const GENDER_LABELS: Record<ProfileGender, string> = {
  female: "女性",
  male: "男性",
  other: "其他",
  prefer_not_to_say: "不透露",
};
