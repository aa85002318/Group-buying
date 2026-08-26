-- Admin-editable HTML content templates for product intro sections
-- (商品介紹 / 適合用途 / 商品規格). Shipping remains site_legal_documents.

CREATE TABLE IF NOT EXISTS public.product_content_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  template_key TEXT NOT NULL UNIQUE,
  section TEXT NOT NULL
    CHECK (section IN ('rich_description', 'product_info', 'specifications')),
  body_html TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_content_templates_section
  ON public.product_content_templates (section, sort_order, name);

ALTER TABLE public.product_content_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS product_content_templates_admin ON public.product_content_templates;
CREATE POLICY product_content_templates_admin ON public.product_content_templates
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS product_content_templates_read ON public.product_content_templates;
CREATE POLICY product_content_templates_read ON public.product_content_templates
  FOR SELECT USING (is_active = TRUE);

INSERT INTO public.product_content_templates (name, template_key, section, body_html, sort_order)
VALUES
  (
    '基本商品介紹',
    'basic_intro',
    'rich_description',
    '<h2>商品特色</h2><p>請填寫商品重點說明。</p><h3>使用方式</h3><p></p>',
    10
  ),
  (
    '食品商品介紹',
    'food_intro',
    'rich_description',
    '<h2>商品介紹</h2><p></p><h3>保存方式</h3><p>請依包裝標示保存。</p><h3>注意事項</h3><p></p>',
    20
  ),
  (
    '烘焙材料介紹',
    'baking_intro',
    'rich_description',
    '<h2>產品說明</h2><p></p><h3>規格</h3><p></p><h3>建議用法</h3><p></p>',
    30
  ),
  (
    '適合用途（基本）',
    'usage_basic',
    'product_info',
    '<p>適合居家烘焙與日常料理使用。</p>',
    10
  ),
  (
    '適合用途（烘焙材料）',
    'usage_baking',
    'product_info',
    '<p>適合麵包、蛋糕、餅乾等烘焙用途。</p><p>實際用量請依配方調整。</p>',
    20
  ),
  (
    '商品規格（基本）',
    'specs_basic',
    'specifications',
    '<p>請見包裝標示。</p>',
    10
  ),
  (
    '商品規格（食品）',
    'specs_food',
    'specifications',
    '<ul><li>內容物：</li><li>淨重／容量：</li><li>保存期限：請見包裝標示</li><li>保存方式：</li></ul>',
    20
  )
ON CONFLICT (template_key) DO NOTHING;

COMMENT ON TABLE public.product_content_templates IS
  'Reusable HTML templates for product intro blocks (特色／用途／規格)';
