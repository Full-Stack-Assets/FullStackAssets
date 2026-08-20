BEGIN;

CREATE TABLE publishers (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('FIRST_PARTY','VERIFIED_THIRD_PARTY')),
  verification_state TEXT NOT NULL DEFAULT 'VERIFIED',
  trust_tier TEXT NOT NULL CHECK (trust_tier IN ('NEW','VERIFIED','ESTABLISHED','ENTERPRISE','FIRST_PARTY')),
  payout_state TEXT,
  policy_acceptance_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  publisher_id TEXT NOT NULL REFERENCES publishers(id),
  type TEXT NOT NULL CHECK (type IN ('SKILL','AGENT','WORKFLOW_PACK','COLLECTION')),
  slug TEXT NOT NULL UNIQUE,
  canonical_refs JSONB NOT NULL,
  visibility TEXT NOT NULL CHECK (visibility IN ('PRIVATE','UNLISTED','PUBLIC')),
  commercial_state TEXT NOT NULL CHECK (commercial_state IN ('DRAFT','REFERENCE_ONLY','FREE','PAID','PILOT','COMING_SOON','ENTERPRISE_ONLY','SUSPENDED','RETIRED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE product_versions (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  version TEXT NOT NULL,
  canonical_snapshot JSONB NOT NULL,
  canonical_hash TEXT NOT NULL CHECK (canonical_hash ~ '^[A-Fa-f0-9]{64}$'),
  compatibility JSONB NOT NULL DEFAULT '[]'::jsonb,
  dependencies JSONB NOT NULL DEFAULT '[]'::jsonb,
  evaluation_record_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  changelog TEXT NOT NULL DEFAULT '',
  publication_state TEXT NOT NULL CHECK (publication_state IN (
    'DRAFT','VALIDATING','EVALUATING','COMMERCIAL_READY','PUBLICATION_REVIEW','PUBLISHED','SUPERSEDED','RETIRED',
    'BLOCKED_SCHEMA','BLOCKED_DEPENDENCY','BLOCKED_EVALUATION','BLOCKED_RIGHTS','BLOCKED_POLICY','BLOCKED_RUNTIME','SUSPENDED','SECURITY_BLOCKED'
  )),
  created_from_event TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, version)
);

CREATE TABLE product_version_availability (
  product_version_id TEXT PRIMARY KEY REFERENCES product_versions(id),
  availability_state TEXT NOT NULL CHECK (availability_state IN ('ACTIVE','DELISTED','SUSPENDED','SECURITY_BLOCKED','LEGAL_HOLD','RETIRED')),
  reason_code TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE product_components (
  id TEXT PRIMARY KEY,
  product_version_id TEXT NOT NULL REFERENCES product_versions(id),
  canonical_ref TEXT NOT NULL,
  component_type TEXT NOT NULL,
  required BOOLEAN NOT NULL DEFAULT TRUE,
  minimum_version TEXT,
  dependency_order INTEGER NOT NULL DEFAULT 0,
  inclusion_reason TEXT,
  license_inheritance_rule TEXT,
  runtime_requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE runtime_distributions (
  id TEXT PRIMARY KEY,
  product_version_id TEXT NOT NULL REFERENCES product_versions(id),
  runtime TEXT NOT NULL CHECK (runtime IN ('UNIVERSAL','CHATGPT','CURSOR','GEMINI','GROK','MANUS','MCP')),
  adapter_version TEXT,
  artifact_hash TEXT CHECK (artifact_hash IS NULL OR artifact_hash ~ '^[A-Fa-f0-9]{64}$'),
  package_location TEXT,
  compatibility_state TEXT NOT NULL CHECK (compatibility_state IN ('VERIFIED','EXPERIMENTAL','UNAVAILABLE','BLOCKED','DEPRECATED')),
  test_receipt_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_runtime_distribution
ON runtime_distributions (product_version_id, runtime, COALESCE(adapter_version, ''));

CREATE TABLE evaluation_records (
  id TEXT PRIMARY KEY,
  product_version_id TEXT NOT NULL REFERENCES product_versions(id),
  runtime TEXT,
  fixture_set JSONB NOT NULL DEFAULT '[]'::jsonb,
  rubric JSONB NOT NULL DEFAULT '{}'::jsonb,
  score NUMERIC,
  policy_failures JSONB NOT NULL DEFAULT '[]'::jsonb,
  provenance_complete BOOLEAN NOT NULL DEFAULT FALSE,
  compatibility_result TEXT,
  evaluator_id TEXT,
  evidence_receipt_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE publication_records (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  product_version_id TEXT NOT NULL REFERENCES product_versions(id),
  canonical_refs JSONB NOT NULL,
  decision_method TEXT NOT NULL CHECK (decision_method IN ('AUTO','HUMAN')),
  policy_version TEXT NOT NULL,
  reviewer_id TEXT,
  validation JSONB NOT NULL,
  evidence_receipt_id TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE license_policies (
  id TEXT PRIMARY KEY,
  license_class TEXT NOT NULL CHECK (license_class IN ('FREE_PERSONAL','FREE_COMMERCIAL','PERPETUAL_PERSONAL','PERPETUAL_COMMERCIAL','SUBSCRIPTION','TEAM','ENTERPRISE','CUSTOM')),
  terms JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE offers (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  license_policy_id TEXT NOT NULL REFERENCES license_policies(id),
  offer_class TEXT NOT NULL CHECK (offer_class IN ('FREE','ONE_TIME','MONTHLY','ANNUAL','TEAM','ENTERPRISE','CUSTOM')),
  currency TEXT,
  amount_minor BIGINT,
  active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE projection_receipts (
  fingerprint TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  canonical_version TEXT,
  content_hash TEXT NOT NULL,
  product_id TEXT,
  product_version_id TEXT,
  result_state TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE outbox_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  aggregate_type TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE OR REPLACE FUNCTION prevent_published_product_version_mutation()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.publication_state = 'PUBLISHED' THEN
    RAISE EXCEPTION 'Published ProductVersion rows are immutable; change availability or create a new version';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_published_product_version_mutation
BEFORE UPDATE OR DELETE ON product_versions
FOR EACH ROW EXECUTE FUNCTION prevent_published_product_version_mutation();

COMMIT;
