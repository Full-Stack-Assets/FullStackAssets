# Marketplace dynamic production — Supabase

## Selected production stack

Human Authority approved the production provider choice on 2026-08-20. Dynamic marketplace Units 4–8 use the existing **Full-Stack-Assets** Supabase project (`fbwoqjxgyczsyjkbglbb`) rather than introducing a second portfolio database or replacing the public GitHub Pages architecture.

- **Compute:** Supabase Edge Function `marketplace-api`, a thin runtime adapter around the existing Web Request/Response marketplace router and services.
- **PostgreSQL:** existing Supabase Postgres 17 database. Marketplace migrations are additive and leave BuildGraph knowledge tables intact.
- **OIDC/JWKS:** Supabase Auth tokens are verified by the existing `jose` OIDC verifier. Application roles and Human Authority grants are persisted separately; Human Authority is never inferred from admin/reviewer status.
- **Artifact storage:** private Supabase Storage bucket `marketplace-artifacts`, preserving content-addressed artifacts and short-lived signed reads.
- **Public static Library:** independently deployed at `https://fullstackassets.com/library/` by the canonical GitHub Pages host.

## Commerce status

**Paid launch is not enabled.** Production checkout returns `COMMERCE_DISABLED`; no live Stripe adapter or webhook credential is configured. Paid launch remains a separate Human Authority decision.

## Applied production migrations

Marketplace migrations `001` through `009` are applied. Provider-specific hardening includes:

- `007_supabase_production_hardening.sql`: RLS + direct browser-role privilege revocation, provider app-role/Human-Authority persistence, private artifact bucket.
- `008_supabase_function_search_path.sql`: fixed trigger-function `search_path` after Supabase security-advisor review.
- `009_marketplace_foreign_key_indexes.sql`: covering indexes for marketplace foreign keys identified by the production performance advisor.

## Live verification receipts

The production system was exercised against real Supabase Auth, PostgreSQL, Edge Functions, and Storage rather than fixtures:

1. `marketplace-api/health` returned HTTP `200` in production runtime logs.
2. Unauthenticated `/v1/me` returned HTTP `401`.
3. Disposable real Supabase Auth sessions reached authenticated `/v1/me` with HTTP `200`.
4. Cross-organization library access returned HTTP `403`.
5. Cross-publisher product access returned HTTP `403`.
6. A reviewer without a persisted Human Authority grant attempted publication approval and received HTTP `403`.
7. Authenticated `/v1/admin/readiness` returned HTTP `200` against live database/storage/auth/schema dependencies.
8. A content-addressed verification artifact was uploaded to the private bucket, signed for 60 seconds, read back with HTTP `200`, and matched SHA-256 `536dc35de6af8fa3cc88ee27d92691c71ab557a191bcec490b2af40710ae4489`.
9. The signed-storage test exposed and fixed a runtime URL-reconstruction defect: relative signed paths must retain Supabase's `/storage/v1` service prefix. A regression test now locks that contract.
10. Cleanup verification returned zero disposable verifier Auth users, marketplace users, organizations, publishers, products, versions, reviews, verifier roles, Human Authority grants, and `verification/` storage objects.
11. The temporary smoke verifier was replaced with an inert HTTP `410` `VERIFIER_DISABLED` handler.

## Security state

Every marketplace table has RLS enabled and direct `anon`/`authenticated` table privileges revoked. Supabase security advisor currently reports only INFO-level `rls_enabled_no_policy` notices for server-only tables. Those notices are intentional: browser roles have no direct table privileges and the Edge API is the authorization boundary. The prior WARN-level mutable-function-search-path finding was fixed by migration 008.

## Performance state

Supabase performance advisor identified INFO-level unindexed marketplace foreign keys. Migration 009 adds covering indexes for those marketplace relationships. Pre-existing BuildGraph advisor observations are outside this marketplace release and were not modified.

## Rollback

- **Edge:** redeploy the previously verified function version or disable the function without affecting the independently served public Library.
- **Database:** do not destructively drop production tables automatically; use verified backup/restore evidence or a reviewed compensating migration.
- **Artifacts:** content-addressed artifacts are immutable; change availability records rather than package bytes.
- **Auth:** revoke marketplace app roles/Human Authority grants without changing Canon.

## Authority boundary

Canon remains authoritative and cannot be mutated by commerce, Publisher Studio, runtime adapters, or enterprise policy. Enterprise overlays may only narrow authority. Payment success is evidence, not entitlement authority. Consequential/I4 actions remain Human Authority even after purchase or installation.
