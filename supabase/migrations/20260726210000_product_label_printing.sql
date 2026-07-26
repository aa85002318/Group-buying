-- Product Label Printing Center (Phase 1)
-- Templates + print job history. Browser print first; QZ Tray later.

CREATE TABLE IF NOT EXISTS label_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  width_mm NUMERIC NOT NULL DEFAULT 70,
  height_mm NUMERIC NOT NULL DEFAULT 30,
  show_name BOOLEAN NOT NULL DEFAULT true,
  show_price BOOLEAN NOT NULL DEFAULT true,
  show_barcode BOOLEAN NOT NULL DEFAULT true,
  show_weight BOOLEAN NOT NULL DEFAULT true,
  show_spec BOOLEAN NOT NULL DEFAULT true,
  show_brand BOOLEAN NOT NULL DEFAULT false,
  show_sku BOOLEAN NOT NULL DEFAULT false,
  show_qrcode BOOLEAN NOT NULL DEFAULT false,
  show_promo_text BOOLEAN NOT NULL DEFAULT false,
  show_origin BOOLEAN NOT NULL DEFAULT false,
  show_expiry BOOLEAN NOT NULL DEFAULT false,
  show_logo BOOLEAN NOT NULL DEFAULT false,
  name_font_size NUMERIC NOT NULL DEFAULT 14,
  price_font_size NUMERIC NOT NULL DEFAULT 28,
  barcode_font_size NUMERIC NOT NULL DEFAULT 10,
  price_font_weight TEXT NOT NULL DEFAULT 'bold'
    CHECK (price_font_weight IN ('normal', 'bold', 'black')),
  barcode_type TEXT NOT NULL DEFAULT 'CODE128'
    CHECK (barcode_type IN ('CODE128', 'EAN13', 'QR')),
  style_variant TEXT NOT NULL DEFAULT 'standard'
    CHECK (style_variant IN ('standard', 'sale', 'vip', 'wholesale', 'minimal')),
  promo_text TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_system BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS print_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES label_templates(id) ON DELETE SET NULL,
  printer_name TEXT,
  print_mode TEXT NOT NULL DEFAULT 'browser'
    CHECK (print_mode IN ('browser', 'pdf', 'qz')),
  status TEXT NOT NULL DEFAULT 'completed'
    CHECK (status IN ('draft', 'printing', 'completed', 'failed', 'cancelled')),
  printed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  printed_at TIMESTAMPTZ,
  total_labels INT NOT NULL DEFAULT 0,
  width_mm NUMERIC,
  height_mm NUMERIC,
  paper_mode TEXT NOT NULL DEFAULT 'label'
    CHECK (paper_mode IN ('label', 'a4')),
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS print_job_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES print_jobs(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INT NOT NULL DEFAULT 1,
  copies INT NOT NULL DEFAULT 1,
  price_used NUMERIC,
  compare_price NUMERIC,
  price_source TEXT,
  custom_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_print_jobs_printed_at ON print_jobs(printed_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_print_job_items_job ON print_job_items(job_id);
CREATE INDEX IF NOT EXISTS idx_print_job_items_product ON print_job_items(product_id);
CREATE INDEX IF NOT EXISTS idx_label_templates_default ON label_templates(is_default) WHERE is_default;

INSERT INTO label_templates (
  name, code, width_mm, height_mm,
  show_name, show_price, show_barcode, show_weight, show_spec, show_brand, show_sku,
  show_qrcode, show_promo_text, show_logo,
  name_font_size, price_font_size, barcode_font_size, price_font_weight,
  barcode_type, style_variant, promo_text, is_default, is_system, sort_order
) VALUES
  ('一般價格牌', 'standard', 70, 30,
   true, true, true, true, true, false, false,
   false, false, false,
   14, 28, 10, 'bold',
   'CODE128', 'standard', NULL, true, true, 1),
  ('特價', 'sale', 70, 30,
   true, true, true, true, false, false, false,
   false, true, false,
   13, 30, 10, 'black',
   'CODE128', 'sale', 'SALE', false, true, 2),
  ('會員價', 'vip', 70, 30,
   true, true, true, false, false, false, false,
   false, true, false,
   13, 28, 10, 'bold',
   'CODE128', 'vip', 'VIP', false, true, 3),
  ('大量批發', 'wholesale', 70, 40,
   true, true, true, true, true, false, false,
   false, true, false,
   14, 26, 10, 'bold',
   'CODE128', 'wholesale', '整箱優惠', false, true, 4),
  ('極簡', 'minimal', 50, 30,
   true, true, true, false, false, false, false,
   false, false, false,
   12, 26, 9, 'bold',
   'CODE128', 'minimal', NULL, false, true, 5)
ON CONFLICT (code) DO NOTHING;

ALTER TABLE label_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_job_items ENABLE ROW LEVEL SECURITY;
