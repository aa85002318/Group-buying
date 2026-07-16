import { getSiteUrl } from "@/lib/env";
import { formatCurrency, formatDate } from "@/lib/utils";
import { emailButton, emailInfoRow, escapeHtml, wrapEmailHtml } from "@/lib/email/layout";
import {
  applyEmailTemplateVars,
  DEFAULT_EMAIL_TEMPLATES,
  type EmailTemplateRecord,
  type EmailTemplateVars,
} from "@/lib/email/template-store";

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

export function buildOrderConfirmationEmail(
  data: OrderConfirmationEmailData,
  template: EmailTemplateRecord = DEFAULT_EMAIL_TEMPLATES.order_confirmation
): { subject: string; html: string } {
  const siteUrl = getSiteUrl();
  const orderUrl = `${siteUrl}/orders/${data.orderId}`;
  const vars: EmailTemplateVars = {
    customer_name: data.customerName,
    order_no: data.orderNo,
    total_amount: formatCurrency(data.totalAmount),
    created_at: formatDate(data.createdAt),
    store_name: data.storeName ?? "",
    store_address: data.storeAddress ?? "",
  };

  const itemsRows = data.items
    .map(
      (item) => `<tr>
        <td style="padding:12px 8px;border-bottom:1px solid #EEE5DC;color:#333333;font-size:14px;">${item.product_name}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #EEE5DC;color:#333333;font-size:14px;text-align:center;">${item.quantity}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #EEE5DC;color:#333333;font-size:14px;text-align:right;">${formatCurrency(item.subtotal)}</td>
      </tr>`
    )
    .join("");

  const heading = applyEmailTemplateVars(template.heading, vars);
  const intro = applyEmailTemplateVars(template.intro_html, vars);
  const footer = applyEmailTemplateVars(template.footer_note, vars);
  const buttonLabel = applyEmailTemplateVars(template.button_label, vars);
  const subject = applyEmailTemplateVars(template.subject, vars);
  const preheader = applyEmailTemplateVars(template.preheader, vars);

  const bodyHtml = `
    <h1 style="margin:0 0 8px;font-size:20px;color:#6B4423;">${escapeHtml(heading)}</h1>
    <div style="margin:0 0 20px;color:#666666;font-size:14px;line-height:1.7;">${intro}</div>

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

    ${footer ? `<p style="margin:16px 0 0;font-size:13px;color:#888888;">${escapeHtml(footer)}</p>` : ""}
    ${emailButton(orderUrl, buttonLabel)}
  `;

  return {
    subject,
    html: wrapEmailHtml({
      title: heading,
      preheader,
      bodyHtml,
    }),
  };
}
