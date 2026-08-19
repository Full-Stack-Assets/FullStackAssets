CREATE TABLE IF NOT EXISTS runtime_compatibility_receipts (
  id TEXT PRIMARY KEY,
  product_version_id TEXT NOT NULL REFERENCES product_versions(id),
  runtime TEXT NOT NULL,
  adapter_version TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('VERIFIED','EXPERIMENTAL','UNAVAILABLE','BLOCKED','DEPRECATED')),
  artifact_hash TEXT,
  evaluation_record_id TEXT REFERENCES evaluation_records(id),
  evidence_receipt_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_version_id,runtime,adapter_version,evidence_receipt_id)
);

CREATE TABLE IF NOT EXISTS runtime_package_plans (
  id TEXT PRIMARY KEY,
  product_version_id TEXT NOT NULL REFERENCES product_versions(id),
  runtime TEXT NOT NULL,
  adapter_version TEXT NOT NULL,
  plan_hash TEXT NOT NULL,
  canonical_snapshot_hash TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('PLANNED','BUILT','BLOCKED','RETIRED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_version_id,runtime,adapter_version,plan_hash)
);

CREATE INDEX IF NOT EXISTS runtime_compatibility_product_idx ON runtime_compatibility_receipts(product_version_id,runtime);
