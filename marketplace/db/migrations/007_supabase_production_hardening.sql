BEGIN;

-- Provider-specific persistence for application authorization. These tables are
-- downstream runtime state only; they do not modify Canon or Agent authority.
CREATE TABLE IF NOT EXISTS marketplace_app_roles (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('CUSTOMER','ORG_MEMBER','ORG_ADMIN','PUBLISHER_MEMBER','PUBLISHER_ADMIN','REVIEWER','MARKETPLACE_ADMIN')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','SUSPENDED','REVOKED')),
  granted_by TEXT NOT NULL,
  evidence_receipt_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, role)
);

CREATE TABLE IF NOT EXISTS marketplace_human_authority_grants (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scope TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','SUSPENDED','REVOKED','EXPIRED')),
  evidence_receipt_id TEXT NOT NULL,
  granted_by TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (expires_at IS NULL OR expires_at > starts_at)
);
CREATE INDEX IF NOT EXISTS idx_marketplace_human_authority_user
  ON marketplace_human_authority_grants(user_id,status,scope);

-- Canon-derived enterprise policy baseline. This is a cached projection with
-- provenance, never an editable alternate Canon definition.
CREATE TABLE IF NOT EXISTS organization_canonical_policies (
  organization_id TEXT PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  canonical_policy JSONB NOT NULL,
  canonical_hash TEXT NOT NULL CHECK (canonical_hash ~ '^[A-Fa-f0-9]{64}$'),
  evidence_receipt_id TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- The marketplace server/Edge function is the authorization boundary. Browser
-- clients do not receive direct PostgREST access to these tables.
ALTER TABLE public.publishers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.publishers FROM anon, authenticated;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.products FROM anon, authenticated;
ALTER TABLE public.product_versions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.product_versions FROM anon, authenticated;
ALTER TABLE public.product_version_availability ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.product_version_availability FROM anon, authenticated;
ALTER TABLE public.product_components ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.product_components FROM anon, authenticated;
ALTER TABLE public.runtime_distributions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.runtime_distributions FROM anon, authenticated;
ALTER TABLE public.evaluation_records ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.evaluation_records FROM anon, authenticated;
ALTER TABLE public.publication_records ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.publication_records FROM anon, authenticated;
ALTER TABLE public.license_policies ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.license_policies FROM anon, authenticated;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.offers FROM anon, authenticated;
ALTER TABLE public.projection_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.projection_receipts FROM anon, authenticated;
ALTER TABLE public.outbox_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.outbox_events FROM anon, authenticated;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.users FROM anon, authenticated;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.organizations FROM anon, authenticated;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.memberships FROM anon, authenticated;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.purchases FROM anon, authenticated;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.subscriptions FROM anon, authenticated;
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.entitlements FROM anon, authenticated;
ALTER TABLE public.installations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.installations FROM anon, authenticated;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.collections FROM anon, authenticated;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.collection_items FROM anon, authenticated;
ALTER TABLE public.update_preferences ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.update_preferences FROM anon, authenticated;
ALTER TABLE public.publisher_memberships ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.publisher_memberships FROM anon, authenticated;
ALTER TABLE public.commercial_candidates ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.commercial_candidates FROM anon, authenticated;
ALTER TABLE public.canon_change_proposals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.canon_change_proposals FROM anon, authenticated;
ALTER TABLE public.publication_reviews ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.publication_reviews FROM anon, authenticated;
ALTER TABLE public.runtime_build_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.runtime_build_jobs FROM anon, authenticated;
ALTER TABLE public.publisher_audit_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.publisher_audit_events FROM anon, authenticated;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.payment_events FROM anon, authenticated;
ALTER TABLE public.commerce_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.commerce_receipts FROM anon, authenticated;
ALTER TABLE public.runtime_compatibility_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.runtime_compatibility_receipts FROM anon, authenticated;
ALTER TABLE public.runtime_package_plans ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.runtime_package_plans FROM anon, authenticated;
ALTER TABLE public.private_registries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.private_registries FROM anon, authenticated;
ALTER TABLE public.private_registry_products ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.private_registry_products FROM anon, authenticated;
ALTER TABLE public.enterprise_policy_overlays ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.enterprise_policy_overlays FROM anon, authenticated;
ALTER TABLE public.publisher_verifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.publisher_verifications FROM anon, authenticated;
ALTER TABLE public.publisher_revenue_share_policies ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.publisher_revenue_share_policies FROM anon, authenticated;
ALTER TABLE public.enterprise_audit_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.enterprise_audit_events FROM anon, authenticated;
ALTER TABLE public.marketplace_app_roles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.marketplace_app_roles FROM anon, authenticated;
ALTER TABLE public.marketplace_human_authority_grants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.marketplace_human_authority_grants FROM anon, authenticated;
ALTER TABLE public.organization_canonical_policies ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.organization_canonical_policies FROM anon, authenticated;

-- Private, content-addressed package store. Signed reads are issued server-side.
INSERT INTO storage.buckets (id,name,public)
VALUES ('marketplace-artifacts','marketplace-artifacts',false)
ON CONFLICT (id) DO UPDATE SET public=false;

COMMIT;
