BEGIN;
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  issuer TEXT NOT NULL,
  external_subject TEXT NOT NULL,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','SUSPENDED','DISABLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (issuer, external_subject)
);
CREATE TABLE organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','SUSPENDED','CLOSED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE memberships (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  app_role TEXT NOT NULL CHECK (app_role IN ('ORG_MEMBER','ORG_ADMIN')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','SUSPENDED','REVOKED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, user_id)
);
CREATE TABLE purchases (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  organization_id TEXT REFERENCES organizations(id),
  offer_id TEXT NOT NULL REFERENCES offers(id),
  external_payment_ref TEXT,
  state TEXT NOT NULL CHECK (state IN ('PENDING','PAID','REFUNDED','FAILED','CANCELLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((user_id IS NOT NULL)::int + (organization_id IS NOT NULL)::int = 1)
);
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  organization_id TEXT REFERENCES organizations(id),
  offer_id TEXT NOT NULL REFERENCES offers(id),
  external_subscription_ref TEXT,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE','PAST_DUE','CANCELLED','EXPIRED','SUSPENDED')),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((user_id IS NOT NULL)::int + (organization_id IS NOT NULL)::int = 1)
);
CREATE TABLE entitlements (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  organization_id TEXT REFERENCES organizations(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  license_policy_id TEXT NOT NULL REFERENCES license_policies(id),
  acquired_version TEXT NOT NULL,
  version_policy TEXT NOT NULL CHECK (version_policy IN ('EXACT','PATCH_PINNED','MINOR_PINNED','MAJOR_PINNED','CURRENT_WHILE_ACTIVE')),
  allowed_runtimes JSONB NOT NULL DEFAULT '["UNIVERSAL"]'::jsonb,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE','SUSPENDED','EXPIRED','REVOKED')),
  source_purchase_id TEXT REFERENCES purchases(id),
  source_subscription_id TEXT REFERENCES subscriptions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((user_id IS NOT NULL)::int + (organization_id IS NOT NULL)::int = 1)
);
CREATE INDEX idx_entitlements_user ON entitlements(user_id, product_id);
CREATE INDEX idx_entitlements_org ON entitlements(organization_id, product_id);
CREATE TABLE installations (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  organization_id TEXT REFERENCES organizations(id),
  product_version_id TEXT NOT NULL REFERENCES product_versions(id),
  runtime_distribution_id TEXT REFERENCES runtime_distributions(id),
  runtime TEXT NOT NULL,
  installed_version TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('INSTALLED','REMOVED','BLOCKED')),
  installed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((user_id IS NOT NULL)::int + (organization_id IS NOT NULL)::int = 1)
);
CREATE UNIQUE INDEX uq_installations_user ON installations(user_id,product_version_id,runtime) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX uq_installations_org ON installations(organization_id,product_version_id,runtime) WHERE organization_id IS NOT NULL;
CREATE TABLE collections (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  organization_id TEXT REFERENCES organizations(id),
  name TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'PRIVATE' CHECK (visibility IN ('PRIVATE','ORGANIZATION')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((user_id IS NOT NULL)::int + (organization_id IS NOT NULL)::int = 1)
);
CREATE TABLE collection_items (
  id TEXT PRIMARY KEY,
  collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  pinned_version TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (collection_id, product_id)
);
CREATE TABLE update_preferences (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  organization_id TEXT REFERENCES organizations(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  channel TEXT NOT NULL DEFAULT 'STABLE' CHECK (channel IN ('ALPHA','BETA','STABLE','LTS')),
  pinned_version TEXT,
  auto_update BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((user_id IS NOT NULL)::int + (organization_id IS NOT NULL)::int = 1)
);
COMMIT;
