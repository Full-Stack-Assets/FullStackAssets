# FullStackAssets

## Agentic Capability Library marketplace

The marketplace is a Canon-backed, provider-neutral Agent/Skill Library. Canon remains authoritative; marketplace records, commercial state, runtime adapters, customer entitlements, and enterprise policy are downstream and cannot expand canonical authority.

## Current production status

All eight implementation units are merged to canonical `main`. The public Library remains independently deployed through GitHub Pages at `https://fullstackassets.com/library/`. Dynamic Units 4–8 run on the approved Supabase production adapter using the existing `Full-Stack-Assets` project (`fbwoqjxgyczsyjkbglbb`). Paid commerce remains disabled and no live Stripe credentials are configured.

### Unit 1: Canon Registry Adapter

Deterministic stable-ID ingestion, hashes, relationships, append-only events, and fail-closed last-known-good behavior.

### Unit 2: Marketplace Core

`REFERENCE_ONLY` Product/ProductVersion projection, immutable version semantics, publication policy, and public-reference allowlisting.

### Unit 3: Public Library

Deterministic catalog materialization, search/detail pages, automatic Canon-to-volume generation, and GitHub Pages integration.

### Unit 4: Customer Library

OIDC identity, application roles, organization isolation, entitlements, immutable artifact authorization, installations, collections, and update state.

### Unit 5: Publisher Studio

Commercial candidates, evaluations/builds, Offers, payload-bound publication review, Human Authority approval, and Canon-change proposals.

### Unit 6: Commerce & Production Hardening

Stripe adapter boundary, signed/idempotent payment events, entitlement lifecycle, package scanning, immutable artifact receipts, recovery, telemetry, and release gates. Production checkout remains `COMMERCE_DISABLED` until paid launch receives separate Human Authority approval.

### Unit 7: Runtime Distribution

Provider-neutral universal/runtime packages and evidence-derived compatibility for supported runtimes without authority escalation.

### Unit 8: Enterprise Governance

Private registries, restriction-only enterprise policy, curated publisher verification, revenue-share policy contracts, and final launch-evidence validation.

## Full verification

Run the complete repository suite with explicit test directories:

```bash
node --test \
  tests/*.test.mjs \
  tests/marketplace/canon/*.test.mjs \
  tests/marketplace/core/*.test.mjs \
  tests/marketplace/catalog/*.test.mjs \
  tests/marketplace/api/*.test.mjs \
  tests/marketplace/customer/*.test.mjs \
  tests/marketplace/publisher/*.test.mjs \
  tests/marketplace/distribution/*.test.mjs \
  tests/marketplace/commerce/*.test.mjs \
  tests/marketplace/security/*.test.mjs \
  tests/marketplace/operations/*.test.mjs \
  tests/marketplace/release/*.test.mjs \
  tests/marketplace/enterprise/*.test.mjs \
  tests/marketplace/launch/*.test.mjs \
  tests/marketplace/production/*.test.mjs
```

Release and launch evidence are additionally checked with:

```bash
node marketplace/bin/verify-marketplace-release.mjs --fixture tests/fixtures/release/pass.json
node marketplace/bin/verify-marketplace-launch.mjs --fixture tests/fixtures/launch/pass.json
```

## Production receipts

Production deployment uses the already-approved architecture rather than a substitute service:

- **Static:** canonical GitHub Pages apex host serves `https://fullstackassets.com/library/`.
- **Dynamic compute:** Supabase Edge Function `marketplace-api`.
- **Database:** existing Supabase PostgreSQL project with marketplace migrations `001`–`009` applied.
- **Auth:** real Supabase Auth/OIDC sessions verified against the live API.
- **Authorization:** live cross-user, cross-organization, and cross-publisher isolation verified; publication approval without a persisted Human Authority grant returns `403`.
- **Artifacts:** private `marketplace-artifacts` bucket; live content-addressed upload and 60-second signed read verified with SHA-256 integrity.
- **Readiness:** authenticated live readiness endpoint returned `200` against production dependencies.
- **Security:** marketplace tables have RLS enabled and direct `anon`/`authenticated` table privileges revoked. Security advisor has no WARN-level marketplace finding; no-policy notices are intentional INFO because browser roles have no direct table privileges.
- **Performance:** marketplace foreign-key indexes are applied by migration `009_marketplace_foreign_key_indexes.sql`.
- **Verification hygiene:** disposable production-verifier users, organizations, publishers, products, reviews, roles, Human Authority grants, and storage objects were confirmed absent after cleanup; the temporary verifier is disabled with HTTP `410` behavior.
- **Commerce:** paid launch is intentionally disabled and remains a separate Human Authority decision.

See `docs/runbooks/marketplace-supabase-production.md` for provider details, rollback, and live verification evidence. Design and implementation plans live under `docs/superpowers/specs/` and `docs/superpowers/plans/`.
