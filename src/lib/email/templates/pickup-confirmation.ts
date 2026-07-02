import { BRAND_NAME, getSiteUrl } from "@/lib/env";
import { formatCurrency, formatDate } from "@/lib/utils";
import { emailButton, emailInfoRow, wrapEmailHtml } from "@/lib/email/layout";

export interface PickupConfirmationEmailData {
  customerName: string;
  orderId: string;
  orderNo: string;
  totalAmount: number;
  pickedUpAt: string;
  storeName?: string | null;
  items: { product_name: string; quantity: number }[];
}

export function buildPickupConfirmationEmail(data: PickupConfirmationEmailData): { subject: string; html: string } {
  const siteUrl = getSiteUrl();
  const orderUrl = `${siteUrl}/orders/${data.orderId}`;

  const itemsList = data.items
    .map((item) => `<li style="margin:4px 0;color:#333333;font-size:14px;">${item.product_name} × ${item.quantity}</li>`)
    .join("");

  const bodyHtml = `
    <h1 style="margin:0 0 8px;font-size:20px;color:#6B4423;">取貨完成通知</h1>
    <p style="margin:0 0 20px;color:#666666;font-size:14px;">${data.customerName ? `${data.customerName} 您好，` : "您好，"}您的訂單已完成取貨，感謝您選擇 ${BRAND_NAME}！</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      ${emailInfoRow("訂單編號", data.orderNo)}
      ${emailInfoRow("取貨時間", formatDate(data.pickedUpAt))}
      ${data.storeName ? emailInfoRow("取貨門市", data.storeName) : ""}
      ${emailInfoRow("訂單金額", formatCurrency(data.totalAmount))}
    </table>

    <div style="background:#F5F0EB;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#6B4423;">取貨商品</p>
      <ul style="margin:0;padding-left:20px;">${itemsList}</ul>
    </div>

    <p style="margin:0;font-size:13px;color:#888888;">期待您再次光臨，若有任何問題歡迎隨時聯絡我們。</p>
    ${emailButton(orderUrl, "查看訂單紀錄")}
  `;

  return {
    subject: `【${BRAND_NAME}】取貨完成 ${data.orderNo}`,
    html: wrapEmailHtml({
      title: `取貨完成 ${data.orderNo}`,
      preheader: `訂單 ${data.orderNo} 已完成取貨，感謝您的購買！`,
      bodyHtml,
    }),
  };
}
