import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import {
  EMAIL_TEMPLATE_IDS,
  EMAIL_TEMPLATE_PLACEHOLDERS,
  listEmailTemplates,
  upsertEmailTemplate,
  type EmailTemplateId,
} from "@/lib/email/template-store";
import { buildOrderConfirmationEmail } from "@/lib/email/templates/order-confirmation";
import { buildOrderUnpaidEmail } from "@/lib/email/templates/order-unpaid";
import { buildOrderCancelledEmail } from "@/lib/email/templates/order-cancelled";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const templates = await listEmailTemplates();
  return NextResponse.json({
    templates,
    placeholders: EMAIL_TEMPLATE_PLACEHOLDERS,
  });
}

export async function PUT(request: Request) {
  const { error, auth } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const id = body.id as EmailTemplateId;
  if (!EMAIL_TEMPLATE_IDS.includes(id)) {
    return NextResponse.json({ error: "未知的版型類型" }, { status: 400 });
  }

  if (!body.subject?.trim() || !body.heading?.trim()) {
    return NextResponse.json({ error: "請填寫主旨與標題" }, { status: 400 });
  }

  try {
    const template = await upsertEmailTemplate({
      id,
      label: body.label ?? "",
      subject: body.subject,
      heading: body.heading,
      intro_html: body.intro_html ?? "",
      footer_note: body.footer_note ?? "",
      button_label: body.button_label ?? "查看訂單",
      preheader: body.preheader ?? "",
    });

    await logAudit(auth!.profile.id, "update_email_template", "email_templates", id, null, template);
    return NextResponse.json({ template });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "儲存失敗" },
      { status: 500 }
    );
  }
}

/** Preview rendered HTML with sample order data. */
export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const id = body.id as EmailTemplateId;
  if (!EMAIL_TEMPLATE_IDS.includes(id)) {
    return NextResponse.json({ error: "未知的版型類型" }, { status: 400 });
  }

  const template = {
    id,
    label: body.label ?? "",
    subject: body.subject ?? "",
    heading: body.heading ?? "",
    intro_html: body.intro_html ?? "",
    footer_note: body.footer_note ?? "",
    button_label: body.button_label ?? "查看訂單",
    preheader: body.preheader ?? "",
  };

  const sample = {
    customerName: "王小明",
    orderId: "preview-order",
    orderNo: "GB20260716001",
    totalAmount: 1280,
    subtotal: 1200,
    discount: 0,
    shippingFee: 80,
    createdAt: new Date().toISOString(),
    storeName: "忠孝門市",
    storeAddress: "台北市大安區忠孝東路四段1號",
    reason: "客戶要求取消",
    items: [
      { product_name: "示範商品 A", quantity: 2, subtotal: 800 },
      { product_name: "示範商品 B", quantity: 1, subtotal: 400 },
    ],
  };

  let rendered: { subject: string; html: string };
  if (id === "order_confirmation") {
    rendered = buildOrderConfirmationEmail(sample, template);
  } else if (id === "order_unpaid") {
    rendered = buildOrderUnpaidEmail(sample, template);
  } else {
    rendered = buildOrderCancelledEmail(sample, template);
  }

  return NextResponse.json(rendered);
}
