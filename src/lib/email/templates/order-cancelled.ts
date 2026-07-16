import { BRAND_NAME, getSiteUrl } from "@/lib/env";
import { formatCurrency, formatDate } from "@/lib/utils";
import { emailButton, emailInfoRow, wrapEmailHtml } from "@/lib/email/layout";

export interface OrderCancelledEmailData {
  customerName: string;
  orderId: string;
  orderNo: string;
  totalAmount: number;
  createdAt: string;
  reason?: string | null;
}

export function buildOrderCancelledEmail(data: OrderCancelledEmailData): { subject: string; html: string } {
  const orderUrl = `${getSiteUrl()}/orders/${data.orderId}`;

  const bodyHtml = `
    <h1 style="margin:0 0 8px;font-size:20px;color:#6B4423;">訂單取消通知</h1>
    <p style="margin:0 0 20px;color:#666666;font-size:14px;">
      ${data.customerName ? `${data.customerName} 您好，` : "您好，"}您在 ${BRAND_NAME} 的訂單已取消。
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      ${emailInfoRow("訂單編號", data.orderNo)}
      ${emailInfoRow("下單時間", formatDate(data.createdAt))}
      ${emailInfoRow("訂單金額", formatCurrency(data.totalAmount))}
      ${data.reason ? emailInfoRow("取消原因", data.reason) : ""}
    </table>

    <p style="margin:0 0 8px;font-size:13px;color:#888888;">如有疑問，請透過客服中心與我們聯繫。</p>
    ${emailButton(orderUrl, "查看訂單")}
  `;

  return {
    subject: `【${BRAND_NAME}】訂單已取消 ${data.orderNo}`,
    html: wrapEmailHtml({
      title: `訂單取消 ${data.orderNo}`,
      preheader: `訂單 ${data.orderNo} 已取消`,
      bodyHtml,
    }),
  };
}
