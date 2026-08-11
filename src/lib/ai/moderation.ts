/** Strip PII before storing analytics labels. */
export function deidentifyLabel(raw: string): string {
  return raw
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "")
    .replace(/09\d{8}/g, "")
    .replace(/0\d{1,2}-?\d{6,8}/g, "")
    .replace(/\b\d{4}-\d{4}-\d{4}\b/g, "")
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "")
    .replace(/訂單\s*[A-Za-z0-9_-]{4,}/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);
}

const BLOCKED = [
  /保證.{0,8}成功/,
  /絕對成功/,
  /一定不含過敏/,
  /取代醫師/,
  /處方[箋签]/,
  /自動下單/,
  /幫我改訂單/,
  /刪除會員/,
];

export function findSensitiveHit(text: string, extraRules?: string): string | null {
  for (const re of BLOCKED) {
    if (re.test(text)) return "此問題涉及系統禁止的操作或保證，請改問烘焙技巧或材料問題。";
  }
  const extra = (extraRules ?? "")
    .split(/[\n,，、]/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2 && s.length <= 12);
  for (const word of extra) {
    if (text.includes(word)) {
      return "內容觸及敏感規則，請調整描述後再試。";
    }
  }
  return null;
}
