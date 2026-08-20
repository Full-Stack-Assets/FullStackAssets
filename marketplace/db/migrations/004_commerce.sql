BEGIN;
CREATE TABLE payment_events (provider TEXT NOT NULL,provider_event_id TEXT NOT NULL,event_type TEXT NOT NULL,normalized_payload JSONB NOT NULL,processed_at TIMESTAMPTZ,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),PRIMARY KEY(provider,provider_event_id));
CREATE TABLE commerce_receipts (id TEXT PRIMARY KEY,provider TEXT NOT NULL,provider_event_id TEXT NOT NULL,subject_ref TEXT NOT NULL,offer_ref TEXT,entitlement_id TEXT,result TEXT NOT NULL,audit_ref TEXT,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),UNIQUE(provider,provider_event_id),FOREIGN KEY(provider,provider_event_id) REFERENCES payment_events(provider,provider_event_id));
COMMIT;
