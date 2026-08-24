-- Batch product updates + image import jobs (admin only).
-- Does not duplicate products; stores before/after snapshots for undo.

CREATE TABLE IF NOT EXISTS public.product_batch_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL CHECK (job_type IN ('product_update', 'image_upload')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending', 'uploading', 'processing', 'writing',
      'previewed', 'completed', 'partial', 'failed', 'cancelled'
    )),
  operation_mode TEXT,
  total_items INTEGER NOT NULL DEFAULT 0,
  success_items INTEGER NOT NULL DEFAULT 0,
  failed_items INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.product_batch_job_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.product_batch_jobs(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  source_file_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'ok', 'skipped', 'error')),
  before_data JSONB,
  after_data JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.product_image_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  batch_job_id UUID REFERENCES public.product_batch_jobs(id) ON DELETE SET NULL,
  previous_images JSONB NOT NULL DEFAULT '{}'::jsonb,
  new_images JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  restored_at TIMESTAMPTZ,
  restored_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.product_description_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  template_key TEXT NOT NULL UNIQUE,
  style_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Existing duplicate SKUs (e.g. SKU-C3000001) block a unique index.
-- Uniqueness is enforced in batch preview/execute, not at DB level.
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products (sku);

CREATE INDEX IF NOT EXISTS idx_product_batch_jobs_status ON public.product_batch_jobs(status);
CREATE INDEX IF NOT EXISTS idx_product_batch_jobs_created_at ON public.product_batch_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_batch_jobs_created_by ON public.product_batch_jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_product_batch_job_items_job ON public.product_batch_job_items(job_id);
CREATE INDEX IF NOT EXISTS idx_product_batch_job_items_product ON public.product_batch_job_items(product_id);
CREATE INDEX IF NOT EXISTS idx_product_image_versions_product ON public.product_image_versions(product_id);
CREATE INDEX IF NOT EXISTS idx_product_image_versions_job ON public.product_image_versions(batch_job_id);

ALTER TABLE public.product_batch_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_batch_job_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_image_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_description_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS product_batch_jobs_admin ON public.product_batch_jobs;
CREATE POLICY product_batch_jobs_admin ON public.product_batch_jobs
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS product_batch_job_items_admin ON public.product_batch_job_items;
CREATE POLICY product_batch_job_items_admin ON public.product_batch_job_items
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS product_image_versions_admin ON public.product_image_versions;
CREATE POLICY product_image_versions_admin ON public.product_image_versions
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS product_description_templates_admin ON public.product_description_templates;
CREATE POLICY product_description_templates_admin ON public.product_description_templates
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS product_description_templates_read ON public.product_description_templates;
CREATE POLICY product_description_templates_read ON public.product_description_templates
  FOR SELECT USING (is_active = TRUE);

INSERT INTO public.product_description_templates (name, template_key, style_config)
VALUES
  (
    '烘焙材料公版',
    'baking_ingredient',
    '{"h2":{"fontSize":"20px","fontWeight":"800","color":"#153E73"},"h3":{"fontSize":"16px","fontWeight":"700","color":"#153E73"},"body":{"fontSize":"14px","lineHeight":"1.7","color":"#475467"},"table":{"border":"1px solid #E8E1D7"},"callout":{"background":"#FFF8D9","borderRadius":"12px"},"imageMaxWidth":"100%","mobileStack":true}'::jsonb
  ),
  (
    '乳製品公版',
    'dairy',
    '{"h2":{"fontSize":"20px","fontWeight":"800","color":"#153E73"},"h3":{"fontSize":"16px","fontWeight":"700","color":"#1D4ED8"},"body":{"fontSize":"14px","lineHeight":"1.8","color":"#334155"},"table":{"border":"1px solid #E8E1D7"},"callout":{"background":"#EFF6FF","borderRadius":"12px"},"imageMaxWidth":"100%","mobileStack":true}'::jsonb
  ),
  (
    '冷凍冷藏食品公版',
    'frozen_chilled',
    '{"h2":{"fontSize":"20px","fontWeight":"800","color":"#153E73"},"h3":{"fontSize":"16px","fontWeight":"700","color":"#0F766E"},"body":{"fontSize":"14px","lineHeight":"1.7","color":"#475467"},"table":{"border":"1px solid #E8E1D7"},"callout":{"background":"#ECFDF5","borderRadius":"12px"},"imageMaxWidth":"100%","mobileStack":true}'::jsonb
  ),
  (
    '烘焙器具公版',
    'baking_tools',
    '{"h2":{"fontSize":"20px","fontWeight":"800","color":"#153E73"},"h3":{"fontSize":"16px","fontWeight":"700","color":"#B45309"},"body":{"fontSize":"14px","lineHeight":"1.6","color":"#475467"},"table":{"border":"1px solid #E8E1D7"},"callout":{"background":"#FFF7ED","borderRadius":"12px"},"imageMaxWidth":"100%","mobileStack":true}'::jsonb
  )
ON CONFLICT (template_key) DO NOTHING;

COMMENT ON TABLE public.product_batch_jobs IS 'Admin batch product update / image import jobs';
COMMENT ON TABLE public.product_batch_job_items IS 'Per-product snapshots for batch jobs and undo';
COMMENT ON TABLE public.product_image_versions IS 'Previous gallery snapshots for image batch undo';
COMMENT ON TABLE public.product_description_templates IS 'Storefront product intro style templates';
