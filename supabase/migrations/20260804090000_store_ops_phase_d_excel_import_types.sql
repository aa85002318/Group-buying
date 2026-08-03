-- Phase D: expand store_import_jobs.import_type for Chinese Excel hub
ALTER TABLE store_import_jobs DROP CONSTRAINT IF EXISTS store_import_jobs_import_type_check;

ALTER TABLE store_import_jobs
  ADD CONSTRAINT store_import_jobs_import_type_check
  CHECK (
    import_type IN (
      'expiry',
      'disposal',
      'products',
      'batches',
      'return',
      'anomaly',
      'inventory',
      'price'
    )
  );
