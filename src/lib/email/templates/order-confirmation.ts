import { BRAND_NAME, getSiteUrl } from "@/lib/env";
import { formatCurrency, formatDate } from "@/lib/utils";
import { emailButton, emailInfoRow, wrapEmailHtml } from "@/lib/email/layout";

export interface OrderEmailItem {
  product_name: string;
  quantity: number;
  subtotal: number;
}

export interface OrderConfirmationEmailData {
  customerName: string;
  orderId: string;
  orderNo: string;
  totalAmount: number;
  subtotal: number;
  discount: number;
  shippingFee: number;
  createdAt: string;
  storeName?: string | null;
  storeAddress?: string | null;
  items: OrderEmailItem[];
}

export function buildOrderConfirmationEmail(data: OrderConfirmationEmailData): { subject: string; html: string } {
  const siteUrl = getSiteUrl();
  const orderUrl = `${siteUrl}/orders/${data.orderId}`;

  const itemsRows = data.items
    .map(
      (item) => `<tr>
        <td style="padding:12px 8px;border-bottom:1px solid #EEE5DC;color:#333333;font-size:14px;">${item.product_name}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #EEE5DC;color:#333333;font-size:14px;text-align:center;">${item.quantity}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #EEE5DC;color:#333333;font-size:14px;text-align:right;">${formatCurrency(item.subtotal)}</td>
      </tr>`
    )
    .join("");

  const bodyHtml = `
    <h1 style="margin:0 0 8px;font-size:20px;color:#6B4423;">訂單成立通知</h1>
    <p style="margin:0 0 20px;color:#666666;font-size:14px;">${data.customerName ? `${data.customerName} 您好，` : "您好，"}感謝您在 ${BRAND_NAME} 下單！我們已收到您的訂單，請至門市取貨時出示訂單 QR Code。</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      ${emailInfoRow("訂單編號", data.orderNo)}
      ${emailInfoRow("下單時間", formatDate(data.createdAt))}
      ${data.storeName ? emailInfoRow("取貨門市", data.storeName) : ""}
      ${data.storeAddress ? emailInfoRow("門市地址", data.storeAddress) : ""}
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:16px;">
      <thead>
        <tr style="background:#F5F0EB;">
          <th style="padding:10px 8px;text-align:left;font-size:13px;color:#6B4423;">商品</th>
          <th style="padding:10px 8px;text-align:center;font-size:13px;color:#6B4423;">數量</th>
          <th style="padding:10px 8px;text-align:right;font-size:13px;color:#6B4423;">小計</th>
        </tr>
      </thead>
      <tbody>${itemsRows}</tbody>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
      <tr><td style="text-align:right;padding:4px 0;font-size:14px;color:#666666;">商品小計</td><td style="text-align:right;padding:4px 0;font-size:14px;color:#333333;width:100px;">${formatCurrency(data.subtotal)}</td></tr>
      ${data.discount > 0 ? `<tr><td style="text-align:right;padding:4px 0;font-size:14px;color:#666666;">折扣</td><td style="text-align:right;padding:4px 0;font-size:14px;color:#E85D4C;width:100px;">-${formatCurrency(data.discount)}</td></tr>` : ""}
      ${data.shippingFee > 0 ? `<tr><td style="text-align:right;padding:4px 0;font-size:14px;color:#666666;">運費</td><td style="text-align:right;padding:4px 0;font-size:14px;color:#333333;width:100px;">${formatCurrency(data.shippingFee)}</td></tr>` : ""}
      <tr><td style="text-align:right;padding:8px 0;font-size:16px;font-weight:700;color:#6B4423;">應付金額</td><td style="text-align:right;padding:8px 0;font-size:16px;font-weight:700;color:#E85D4C;width:100px;">${formatCurrency(data.totalAmount)}</td></tr>
    </table>

    <p style="margin:16px 0 0;font-size:13px;color:#888888;">取貨時請出示訂單頁面的 QR Code，門市人員將協助確認收款與取貨。</p>
    ${emailButton(orderUrl, "查看訂單與取貨 QR Code")}
  `;

  return {
    subject: `【${BRAND_NAME}】訂單成立 ${data.orderNo}`,
    html: wrapEmailHtml({
      title: `訂單成立 ${data.orderNo}`,
      preheader: `您的訂單 ${data.orderNo} 已成立，應付 ${formatCurrency(data.totalAmount)}`,
      bodyHtml,
    }),
  };
}
