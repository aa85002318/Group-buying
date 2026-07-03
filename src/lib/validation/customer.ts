/** Taiwan mobile: 09xxxxxxxx */
const PHONE_DIGITS = /^09\d{8}$/;

export function normalizePhone(input: string): string {
  return input.replace(/\D/g, "");
}

/** 會員條碼 = 正規化後的手機號碼 */
export function memberCodeFromPhone(input: string): string {
  return normalizePhone(input);
}

export function isValidTaiwanPhone(input: string): boolean {
  return PHONE_DIGITS.test(normalizePhone(input));
}

export function isValidBirthday(input: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return false;
  const date = new Date(`${input}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date > today) return false;
  const min = new Date();
  min.setFullYear(min.getFullYear() - 120);
  return date >= min;
}

export function formatBirthdayDisplay(value: string | null | undefined): string {
  if (!value) return "—";
  const d = value.slice(0, 10);
  return d || "—";
}
