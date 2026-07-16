import { BRAND_NAME, getSiteUrl } from "@/lib/env";
import { formatCurrency, formatDate } from "@/lib/utils";
import { emailButton, emailInfoRow, wrapEmailHtml } from "@/lib/email/layout";

export interface OrderArrivalEmailData {
  customerName: string;
  orderId: string;
  orderNo: string;
  totalAmount: number;
  storeName?: string | null;
  storeAddress?: string | null;
  items: Array<{ product_name: string; quantity: number }>;
}

export function buildOrderArrivalEmail(data: OrderArrivalEmailData): { subject: string; html: string } {
  const orderUrl = `${getSiteUrl()}/orders/${data.orderId}`;

  const itemsRows = data.items
    .map(
      (item) => `<tr>
        <td style="padding:12px 8px;border-bottom:1px solid #EEE5DC;color:#333333;font-size:14px;">${item.product_name}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #EEE5DC;color:#333333;font-size:14px;text-align:center;">${item.quantity}</td>
      </tr>`
    )
    .join("");

  const bodyHtml = `
    <h1 style="margin:0 0 8px;font-size:20px;color:#6B4423;">到貨通知</h1>
    <p style="margin:0 0 20px;color:#666666;font-size:14px;">
      ${data.customerName ? `${data.customerName} 您好，` : "您好，"}您的訂單商品已到店，請盡快至取貨門市領取，並出示訂單 QR Code。
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      ${emailInfoRow("訂單編號", data.orderNo)}
      ${data.storeName ? emailInfoRow("取貨門市", data.storeName) : ""}
      ${data.storeAddress ? emailInfoRow("門市地址", data.storeAddress) : ""}
      ${emailInfoRow("訂單金額", formatCurrency(data.totalAmount))}
      ${emailInfoRow("通知時間", formatDate(new Date().toISOString()))}
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:16px;">
      <thead>
        <tr style="background:#F5F0EB;">
          <th style="padding:10px 8px;text-align:left;font-size:13px;color:#6B4423;">商品</th>
          <th style="padding:10px 8px;text-align:center;font-size:13px;color:#6B4423;">數量</th>
        </tr>
      </thead>
      <tbody>${itemsRows}</tbody>
    </table>

    ${emailButton(orderUrl, "查看取貨 QR Code")}
  `;

  return {
    subject: `【${BRAND_NAME}】商品已到貨 ${data.orderNo}`,
    html: wrapEmailHtml({
      title: `到貨通知 ${data.orderNo}`,
      preheader: `訂單 ${data.orderNo} 已到店，請盡快取貨`,
      bodyHtml,
    }),
  };
}
