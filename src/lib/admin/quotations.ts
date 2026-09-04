export type QuotationStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "expired"
  | "converted"
  | "cancelled";

export const QUOTATION_STATUS_LABELS: Record<QuotationStatus, string> = {
  draft: "草稿",
  sent: "已送出",
  accepted: "已接受",
  expired: "已過期",
  converted: "已轉單",
  cancelled: "已取消",
};

export type QuotationDisplayOptions = {
  showCompanyHeader: boolean;
  showLogo: boolean;
  showTaxId: boolean;
  showCustomerBlock: boolean;
  showValidUntil: boolean;
  showSku: boolean;
  showBarcode: boolean;
  showUnit: boolean;
  showUnitPrice: boolean;
  showLineSubtotal: boolean;
  showDiscount: boolean;
  showShipping: boolean;
  showNotes: boolean;
  showSignature: boolean;
};

export const DEFAULT_QUOTATION_DISPLAY_OPTIONS: QuotationDisplayOptions = {
  showCompanyHeader: true,
  showLogo: true,
  showTaxId: true,
  showCustomerBlock: true,
  showValidUntil: true,
  showSku: true,
  showBarcode: true,
  showUnit: true,
  showUnitPrice: true,
  showLineSubtotal: true,
  showDiscount: true,
  showShipping: true,
  showNotes: true,
  showSignature: true,
};

export const DISPLAY_OPTION_FIELDS: Array<{
  key: keyof QuotationDisplayOptions;
  label: string;
}> = [
  { key: "showCompanyHeader", label: "公司抬頭" },
  { key: "showLogo", label: "Logo" },
  { key: "showTaxId", label: "統一編號" },
  { key: "showCustomerBlock", label: "客戶區塊" },
  { key: "showValidUntil", label: "報價效期" },
  { key: "showSku", label: "SKU" },
  { key: "showBarcode", label: "條碼" },
  { key: "showUnit", label: "單位" },
  { key: "showUnitPrice", label: "單價" },
  { key: "showLineSubtotal", label: "小計" },
  { key: "showDiscount", label: "折扣" },
  { key: "showShipping", label: "運費" },
  { key: "showNotes", label: "備註" },
  { key: "showSignature", label: "簽核欄" },
];

export type QuotationItemInput = {
  id?: string;
  product_id?: string | null;
  product_name: string;
  sku?: string | null;
  barcode?: string | null;
  unit?: string | null;
  quantity: number;
  unit_price: number;
  note?: string | null;
  sort_order?: number;
};

export type QuotationItem = QuotationItemInput & {
  id: string;
  quotation_id: string;
  subtotal: number;
};

export type Quotation = {
  id: string;
  quote_number: string;
  company_name: string | null;
  contact_name: string;
  contact_phone: string | null;
  contact_email: string | null;
  tax_id: string | null;
  address: string | null;
  user_id: string | null;
  corporate_inquiry_id: string | null;
  subtotal: number;
  discount_amount: number;
  shipping_fee: number;
  total_amount: number;
  notes: string | null;
  valid_until: string | null;
  status: QuotationStatus;
  converted_order_id: string | null;
  created_by: string | null;
  display_options: QuotationDisplayOptions;
  created_at: string;
  updated_at: string;
  quotation_items?: QuotationItem[];
};

export function normalizeDisplayOptions(
  raw: unknown
): QuotationDisplayOptions {
  const base = { ...DEFAULT_QUOTATION_DISPLAY_OPTIONS };
  if (!raw || typeof raw !== "object") return base;
  const obj = raw as Record<string, unknown>;
  for (const key of Object.keys(base) as Array<keyof QuotationDisplayOptions>) {
    if (typeof obj[key] === "boolean") base[key] = obj[key] as boolean;
  }
  return base;
}

export function calcQuotationTotals(
  items: Array<{ quantity: number; unit_price: number }>,
  discountAmount: number,
  shippingFee: number
) {
  const subtotal = items.reduce(
    (sum, item) => sum + Math.max(0, Number(item.quantity) || 0) * Math.max(0, Number(item.unit_price) || 0),
    0
  );
  const discount = Math.max(0, Number(discountAmount) || 0);
  const shipping = Math.max(0, Number(shippingFee) || 0);
  const total = Math.max(0, subtotal - discount + shipping);
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount_amount: Math.round(discount * 100) / 100,
    shipping_fee: Math.round(shipping * 100) / 100,
    total_amount: Math.round(total * 100) / 100,
  };
}

/** Generate QT-YYYYMMDD-XXXX using existing quote numbers for the day. */
export async function nextQuoteNumber(
  listExisting: (prefix: string) => Promise<string[]>
): Promise<string> {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `QT-${date}-`;
  const existing = await listExisting(prefix);
  let max = 0;
  for (const num of existing) {
    const tail = num.slice(prefix.length);
    const n = Number(tail);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}
