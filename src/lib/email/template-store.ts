import { BRAND_NAME } from "@/lib/env";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export type EmailTemplateId = "order_confirmation" | "order_unpaid" | "order_cancelled";

export type EmailTemplateRecord = {
  id: EmailTemplateId;
  label: string;
  subject: string;
  heading: string;
  intro_html: string;
  footer_note: string;
  button_label: string;
  preheader: string;
  updated_at?: string;
};

export const EMAIL_TEMPLATE_IDS: EmailTemplateId[] = [
  "order_confirmation",
  "order_unpaid",
  "order_cancelled",
];

export const EMAIL_TEMPLATE_PLACEHOLDERS = [
  { key: "{{brand}}", desc: "品牌名稱" },
  { key: "{{customer_name}}", desc: "會員姓名" },
  { key: "{{customer_greeting}}", desc: "問候語（例：王小明 您好，）" },
  { key: "{{order_no}}", desc: "訂單編號" },
  { key: "{{total_amount}}", desc: "應付／訂單金額（已格式化）" },
  { key: "{{created_at}}", desc: "下單時間" },
  { key: "{{store_name}}", desc: "取貨門市" },
  { key: "{{store_address}}", desc: "門市地址" },
  { key: "{{cancel_reason}}", desc: "取消原因（僅取消信）" },
] as const;

export const DEFAULT_EMAIL_TEMPLATES: Record<EmailTemplateId, EmailTemplateRecord> = {
  order_confirmation: {
    id: "order_confirmation",
    label: "訂單確認信件",
    subject: "【{{brand}}】訂單成立 {{order_no}}",
    heading: "訂單成立通知",
    intro_html:
      "<p>{{customer_greeting}}感謝您在 {{brand}} 下單！我們已收到您的訂單，請至門市取貨時出示訂單 QR Code。</p>",
    footer_note: "取貨時請出示訂單頁面的 QR Code，門市人員將協助確認收款與取貨。",
    button_label: "查看訂單與取貨 QR Code",
    preheader: "您的訂單 {{order_no}} 已成立，應付 {{total_amount}}",
  },
  order_unpaid: {
    id: "order_unpaid",
    label: "尚未付款通知",
    subject: "【{{brand}}】尚未付款提醒 {{order_no}}",
    heading: "尚未付款通知",
    intro_html:
      "<p>{{customer_greeting}}您在 {{brand}} 的訂單尚未完成付款，請盡快處理以免影響出貨／取貨安排。</p>",
    footer_note: "",
    button_label: "前往付款／查看訂單",
    preheader: "訂單 {{order_no}} 尚未付款，應付 {{total_amount}}",
  },
  order_cancelled: {
    id: "order_cancelled",
    label: "取消訂單通知",
    subject: "【{{brand}}】訂單已取消 {{order_no}}",
    heading: "訂單取消通知",
    intro_html: "<p>{{customer_greeting}}您在 {{brand}} 的訂單已取消。</p>",
    footer_note: "如有疑問，請透過客服中心與我們聯繫。",
    button_label: "查看訂單",
    preheader: "訂單 {{order_no}} 已取消",
  },
};

export type EmailTemplateVars = {
  brand?: string;
  customer_name?: string;
  order_no?: string;
  total_amount?: string;
  created_at?: string;
  store_name?: string;
  store_address?: string;
  cancel_reason?: string;
};

export function applyEmailTemplateVars(text: string, vars: EmailTemplateVars): string {
  const customerName = vars.customer_name?.trim() ?? "";
  const greeting = customerName ? `${customerName} 您好，` : "您好，";
  const map: Record<string, string> = {
    "{{brand}}": vars.brand ?? BRAND_NAME,
    "{{customer_name}}": customerName,
    "{{customer_greeting}}": greeting,
    "{{order_no}}": vars.order_no ?? "",
    "{{total_amount}}": vars.total_amount ?? "",
    "{{created_at}}": vars.created_at ?? "",
    "{{store_name}}": vars.store_name ?? "",
    "{{store_address}}": vars.store_address ?? "",
    "{{cancel_reason}}": vars.cancel_reason ?? "",
  };

  let out = text;
  for (const [key, value] of Object.entries(map)) {
    out = out.split(key).join(value);
  }
  return out;
}

export async function getEmailTemplate(id: EmailTemplateId): Promise<EmailTemplateRecord> {
  const fallback = DEFAULT_EMAIL_TEMPLATES[id];
  if (!isSupabaseConfigured()) return fallback;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.from("email_templates").select("*").eq("id", id).maybeSingle();
    if (error || !data) return fallback;
    return {
      id,
      label: data.label ?? fallback.label,
      subject: data.subject ?? fallback.subject,
      heading: data.heading ?? fallback.heading,
      intro_html: data.intro_html ?? fallback.intro_html,
      footer_note: data.footer_note ?? fallback.footer_note,
      button_label: data.button_label ?? fallback.button_label,
      preheader: data.preheader ?? fallback.preheader,
      updated_at: data.updated_at,
    };
  } catch {
    return fallback;
  }
}

export async function listEmailTemplates(): Promise<EmailTemplateRecord[]> {
  if (!isSupabaseConfigured()) {
    return EMAIL_TEMPLATE_IDS.map((id) => DEFAULT_EMAIL_TEMPLATES[id]);
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.from("email_templates").select("*").in("id", EMAIL_TEMPLATE_IDS);
    if (error) {
      return EMAIL_TEMPLATE_IDS.map((id) => DEFAULT_EMAIL_TEMPLATES[id]);
    }

    const byId = new Map((data ?? []).map((row) => [row.id as string, row]));
    return EMAIL_TEMPLATE_IDS.map((id) => {
      const row = byId.get(id);
      const fallback = DEFAULT_EMAIL_TEMPLATES[id];
      if (!row) return fallback;
      return {
        id,
        label: row.label ?? fallback.label,
        subject: row.subject ?? fallback.subject,
        heading: row.heading ?? fallback.heading,
        intro_html: row.intro_html ?? fallback.intro_html,
        footer_note: row.footer_note ?? fallback.footer_note,
        button_label: row.button_label ?? fallback.button_label,
        preheader: row.preheader ?? fallback.preheader,
        updated_at: row.updated_at,
      };
    });
  } catch {
    return EMAIL_TEMPLATE_IDS.map((id) => DEFAULT_EMAIL_TEMPLATES[id]);
  }
}

export async function upsertEmailTemplate(
  input: Omit<EmailTemplateRecord, "updated_at">
): Promise<EmailTemplateRecord> {
  const now = new Date().toISOString();
  const payload = {
    id: input.id,
    label: input.label.trim() || DEFAULT_EMAIL_TEMPLATES[input.id].label,
    subject: input.subject.trim(),
    heading: input.heading.trim(),
    intro_html: input.intro_html,
    footer_note: input.footer_note.trim(),
    button_label: input.button_label.trim() || "查看訂單",
    preheader: input.preheader.trim(),
    updated_at: now,
  };

  if (!isSupabaseConfigured()) {
    return { ...payload, id: input.id };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from("email_templates").upsert(payload).select().single();
  if (error) throw new Error(error.message);
  return {
    id: input.id,
    label: data.label,
    subject: data.subject,
    heading: data.heading,
    intro_html: data.intro_html,
    footer_note: data.footer_note,
    button_label: data.button_label,
    preheader: data.preheader,
    updated_at: data.updated_at,
  };
}
