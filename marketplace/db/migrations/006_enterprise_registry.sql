CREATE TABLE IF NOT EXISTS private_registries (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE','SUSPENDED','RETIRED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id,name)
);

CREATE TABLE IF NOT EXISTS private_registry_products (
  id TEXT PRIMARY KEY,
  registry_id TEXT NOT NULL REFERENCES private_registries(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  product_version_id TEXT REFERENCES product_versions(id),
  visibility TEXT NOT NULL CHECK (visibility IN ('ORG_ONLY','ORG_ADMIN_ONLY')),
  version_policy TEXT NOT NULL CHECK (version_policy IN ('EXACT','PATCH_PINNED','MINOR_PINNED','MAJOR_PINNED','CURRENT_APPROVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(registry_id,product_id,product_version_id)
);

CREATE TABLE IF NOT EXISTS enterprise_policy_overlays (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  registry_id TEXT REFERENCES private_registries(id),
  allowed_runtimes JSONB NOT NULL DEFAULT '[]'::jsonb,
  denied_permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  allowed_publishers JSONB NOT NULL DEFAULT '[]'::jsonb,
  max_risk_tier TEXT CHECK (max_risk_tier IN ('LOW','MODERATE','HIGH','RESTRICTED')),
  require_verified_runtime BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS publisher_verifications (
  id TEXT PRIMARY KEY,
  publisher_id TEXT NOT NULL REFERENCES publishers(id),
  state TEXT NOT NULL CHECK (state IN ('NEW','IDENTITY_VERIFIED','PROVENANCE_VERIFIED','POLICY_ACCEPTED','HUMAN_REVIEW','VERIFIED','SUSPENDED','REJECTED')),
  identity_evidence_ref TEXT,
  provenance_evidence_ref TEXT,
  policy_version TEXT,
  reviewer_id TEXT,
  decision_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS publisher_revenue_share_policies (
  id TEXT PRIMARY KEY,
  publisher_id TEXT NOT NULL REFERENCES publishers(id),
  platform_basis_points INTEGER NOT NULL CHECK (platform_basis_points BETWEEN 0 AND 10000),
  publisher_basis_points INTEGER NOT NULL CHECK (publisher_basis_points BETWEEN 0 AND 10000),
  status TEXT NOT NULL CHECK (status IN ('DRAFT','ACTIVE','RETIRED')),
  approved_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (platform_basis_points + publisher_basis_points = 10000)
);

CREATE TABLE IF NOT EXISTS enterprise_audit_events (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  actor_ref TEXT NOT NULL,
  action TEXT NOT NULL,
  object_ref TEXT NOT NULL,
  result TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
