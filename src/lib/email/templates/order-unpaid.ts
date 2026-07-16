import { BRAND_NAME, getSiteUrl } from "@/lib/env";
import { formatCurrency, formatDate } from "@/lib/utils";
import { emailButton, emailInfoRow, wrapEmailHtml } from "@/lib/email/layout";

export interface OrderUnpaidEmailData {
  customerName: string;
  orderId: string;
  orderNo: string;
  totalAmount: number;
  createdAt: string;
  storeName?: string | null;
}

export function buildOrderUnpaidEmail(data: OrderUnpaidEmailData): { subject: string; html: string } {
  const orderUrl = `${getSiteUrl()}/orders/${data.orderId}`;

  const bodyHtml = `
    <h1 style="margin:0 0 8px;font-size:20px;color:#6B4423;">尚未付款通知</h1>
    <p style="margin:0 0 20px;color:#666666;font-size:14px;">
      ${data.customerName ? `${data.customerName} 您好，` : "您好，"}您在 ${BRAND_NAME} 的訂單尚未完成付款，請盡快處理以免影響出貨／取貨安排。
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      ${emailInfoRow("訂單編號", data.orderNo)}
      ${emailInfoRow("下單時間", formatDate(data.createdAt))}
      ${data.storeName ? emailInfoRow("取貨門市", data.storeName) : ""}
      ${emailInfoRow("應付金額", formatCurrency(data.totalAmount))}
    </table>

    ${emailButton(orderUrl, "前往付款／查看訂單")}
  `;

  return {
    subject: `【${BRAND_NAME}】尚未付款提醒 ${data.orderNo}`,
    html: wrapEmailHtml({
      title: `尚未付款 ${data.orderNo}`,
      preheader: `訂單 ${data.orderNo} 尚未付款，應付 ${formatCurrency(data.totalAmount)}`,
      bodyHtml,
    }),
  };
}
