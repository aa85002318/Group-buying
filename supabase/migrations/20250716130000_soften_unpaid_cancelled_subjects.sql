-- Soften unpaid/cancelled subjects to improve Gmail inbox delivery
UPDATE email_templates SET
  subject = '【{{brand}}】訂單付款提醒 {{order_no}}',
  heading = '訂單付款提醒',
  intro_html = '<p>{{customer_greeting}}您在 {{brand}} 的訂單尚待完成付款，請盡快處理以免影響出貨／取貨安排。</p>',
  button_label = '前往查看訂單',
  preheader = '訂單 {{order_no}} 尚待付款，金額 {{total_amount}}',
  updated_at = NOW()
WHERE id = 'order_unpaid';

UPDATE email_templates SET
  subject = '【{{brand}}】訂單狀態更新 {{order_no}}',
  heading = '訂單狀態更新',
  intro_html = '<p>{{customer_greeting}}您在 {{brand}} 的訂單狀態已更新為取消。</p>',
  preheader = '訂單 {{order_no}} 狀態已更新',
  updated_at = NOW()
WHERE id = 'order_cancelled';
