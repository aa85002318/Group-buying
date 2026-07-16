-- Editable order email templates (subject / heading / intro / CTA)
CREATE TABLE IF NOT EXISTS email_templates (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  subject TEXT NOT NULL,
  heading TEXT NOT NULL,
  intro_html TEXT NOT NULL DEFAULT '',
  footer_note TEXT NOT NULL DEFAULT '',
  button_label TEXT NOT NULL DEFAULT '查看訂單',
  preheader TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE email_templates IS '訂單相關郵件版型（後台可編輯）';

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Admin-only via service role; no public policies needed for anon/authenticated
DROP POLICY IF EXISTS email_templates_admin_all ON email_templates;

INSERT INTO email_templates (id, label, subject, heading, intro_html, footer_note, button_label, preheader)
VALUES
  (
    'order_confirmation',
    '訂單確認信件',
    '【{{brand}}】訂單成立 {{order_no}}',
    '訂單成立通知',
    '<p>{{customer_greeting}}感謝您在 {{brand}} 下單！我們已收到您的訂單，請至門市取貨時出示訂單 QR Code。</p>',
    '取貨時請出示訂單頁面的 QR Code，門市人員將協助確認收款與取貨。',
    '查看訂單與取貨 QR Code',
    '您的訂單 {{order_no}} 已成立，應付 {{total_amount}}'
  ),
  (
    'order_unpaid',
    '尚未付款通知',
    '【{{brand}}】尚未付款提醒 {{order_no}}',
    '尚未付款通知',
    '<p>{{customer_greeting}}您在 {{brand}} 的訂單尚未完成付款，請盡快處理以免影響出貨／取貨安排。</p>',
    '',
    '前往付款／查看訂單',
    '訂單 {{order_no}} 尚未付款，應付 {{total_amount}}'
  ),
  (
    'order_cancelled',
    '取消訂單通知',
    '【{{brand}}】訂單已取消 {{order_no}}',
    '訂單取消通知',
    '<p>{{customer_greeting}}您在 {{brand}} 的訂單已取消。</p>',
    '如有疑問，請透過客服中心與我們聯繫。',
    '查看訂單',
    '訂單 {{order_no}} 已取消'
  )
ON CONFLICT (id) DO NOTHING;
