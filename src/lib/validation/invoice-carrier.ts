/** Taiwan e-invoice mobile barcode: / + 7 allowed chars = 8 total */
const MOBILE_BARCODE_PATTERN = /^\/[0-9A-Z.+\-]{7}$/;

export const MOBILE_BARCODE_ERROR = "手機條碼格式不正確，請確認是否為 / 開頭的 8 碼條碼";

export function normalizeMobileBarcode(raw: string): string {
  return raw.trim().toUpperCase();
}

export function isValidMobileBarcode(raw: string): boolean {
  return MOBILE_BARCODE_PATTERN.test(normalizeMobileBarcode(raw));
}

export function parseCarrierInput(input: { carrier_name?: string; carrier_code: string }) {
  const carrier_code = normalizeMobileBarcode(input.carrier_code);
  if (!isValidMobileBarcode(carrier_code)) {
    return { ok: false as const, error: MOBILE_BARCODE_ERROR };
  }
  const name = input.carrier_name?.trim();
  const carrier_name = name ? name.slice(0, 30) : "我的手機條碼";
  return { ok: true as const, carrier_name, carrier_code };
}
