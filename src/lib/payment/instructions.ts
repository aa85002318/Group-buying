import { getSiteUrl } from "@/lib/env";

/** 匯款／門市繳費說明（前台可見請用 NEXT_PUBLIC_；未設定時用下列預設） */
export function getBankTransferInfo() {
  return {
    bankName:
      process.env.NEXT_PUBLIC_BANK_NAME?.trim() ||
      process.env.BANK_NAME?.trim() ||
      "台灣銀行",
    bankCode:
      process.env.NEXT_PUBLIC_BANK_CODE?.trim() ||
      process.env.BANK_CODE?.trim() ||
      "004",
    accountNumber:
      process.env.NEXT_PUBLIC_BANK_ACCOUNT?.trim() ||
      process.env.BANK_ACCOUNT?.trim() ||
      "123456789012",
    accountName:
      process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME?.trim() ||
      process.env.BANK_ACCOUNT_NAME?.trim() ||
      "棋美點心屋",
    note:
      process.env.NEXT_PUBLIC_BANK_TRANSFER_NOTE?.trim() ||
      process.env.BANK_TRANSFER_NOTE?.trim() ||
      "匯款後請於訂單回報帳號後五碼與金額，確認後訂單才正式成立。",
  };
}

/** 付款期限（小時），預設 48 小時 */
export function getPaymentDeadlineHours(): number {
  const raw = Number(
    process.env.NEXT_PUBLIC_PAYMENT_DEADLINE_HOURS ??
      process.env.PAYMENT_DEADLINE_HOURS ??
      "48"
  );
  return Number.isFinite(raw) && raw > 0 ? raw : 48;
}

export function paymentDeadlineAt(createdAt: string | Date): Date {
  const base = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  return new Date(base.getTime() + getPaymentDeadlineHours() * 60 * 60 * 1000);
}

export const ORDER_PAYMENT_FLOW_STEPS = [
  "完成下單後，訂單狀態為「待付款」，此時尚未正式成立。",
  "請於指定時間內完成「銀行匯款」或「門市繳費」。",
  "匯款：請於訂單回報匯款金額與帳號後五碼，待門市／後台確認。",
  "門市繳費：至門市付款後，由門市人員在系統標記「已收款」。",
  "付款確認後，訂單才正式成立，方可於門市取貨。",
] as const;

export function orderFlowHelpUrl() {
  return `${getSiteUrl().replace(/\/$/, "")}/support`;
}
