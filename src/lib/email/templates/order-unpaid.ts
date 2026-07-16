import { getSiteUrl } from "@/lib/env";
import { formatCurrency, formatDate } from "@/lib/utils";
import { emailButton, emailInfoRow, escapeHtml, wrapEmailHtml } from "@/lib/email/layout";
import {
  applyEmailTemplateVars,
  DEFAULT_EMAIL_TEMPLATES,
  type EmailTemplateRecord,
  type EmailTemplateVars,
} from "@/lib/email/template-store";

export interface OrderUnpaidEmailData {
  customerName: string;
  orderId: string;
  orderNo: string;
  totalAmount: number;
  createdAt: string;
  storeName?: string | null;
}

export function buildOrderUnpaidEmail(
  data: OrderUnpaidEmailData,
  template: EmailTemplateRecord = DEFAULT_EMAIL_TEMPLATES.order_unpaid
): { subject: string; html: string } {
  const orderUrl = `${getSiteUrl()}/orders/${data.orderId}`;
  const vars: EmailTemplateVars = {
    customer_name: data.customerName,
    order_no: data.orderNo,
    total_amount: formatCurrency(data.totalAmount),
    created_at: formatDate(data.createdAt),
    store_name: data.storeName ?? "",
  };

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
      ${emailInfoRow("應付金額", formatCurrency(data.totalAmount))}
    </table>

    ${footer ? `<p style="margin:0 0 8px;font-size:13px;color:#888888;">${escapeHtml(footer)}</p>` : ""}
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
