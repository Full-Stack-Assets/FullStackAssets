# Marketplace release boundary

The Agentic Capability Library has two intentionally separate production surfaces:

1. **Public static Library:** generated from the Canon-backed public catalog projection and deployed through GitHub Pages.
2. **Dynamic marketplace services:** Customer Library, Publisher Studio, commerce boundary, runtime-distribution state, private enterprise registries, database state, and artifact delivery.

GitHub Pages remains independently deployable; a dynamic-service outage must not break public reference browsing.

## Production API provider gate — resolved

Human Authority resolved the production provider/runtime decision on 2026-08-20. The approved dynamic stack is Supabase using the existing `Full-Stack-Assets` project (`fbwoqjxgyczsyjkbglbb`):

- Supabase Edge Function `marketplace-api` as the thin runtime adapter around the existing Web Request/Response router and services;
- Supabase PostgreSQL with marketplace migrations `001`–`009`;
- Supabase Auth/OIDC/JWKS with application roles and Human Authority persisted separately;
- private Supabase Storage bucket `marketplace-artifacts` with content-addressed keys and short-lived signed reads;
- `https://fullstackassets.com/library/` remains the canonical public GitHub Pages surface.

No substitute architecture was introduced. Production secret values are not committed.

## Release evidence

### Public static release

Verified evidence includes Canon/public projection checks, catalog hash/entry receipt, deterministic Library generation, last-known-good preservation, site/link/accessibility checks, successful canonical Pages deployment, and direct live retrieval of `/library/`.

### Dynamic marketplace release

Live production evidence includes:

- all marketplace tables RLS-enabled with direct `anon`/`authenticated` table privileges revoked;
- real Supabase Auth/OIDC sessions reaching protected routes;
- unauthenticated protected requests returning `401`;
- cross-organization and cross-publisher access returning `403`;
- publication approval without a persisted Human Authority grant returning `403`;
- authenticated readiness returning `200` against database, storage, auth, and schema dependencies;
- private content-addressed artifact upload, 60-second signed read, HTTP `200`, and SHA-256 integrity verification;
- production-verifier fixtures cleaned to zero and the temporary verifier disabled;
- Supabase security advisor with no WARN-level marketplace findings after fixed function `search_path` hardening;
- marketplace foreign-key covering indexes applied by migration `009_marketplace_foreign_key_indexes.sql`;
- fresh repository workflows for Canon, Core, Library, Customer, Publisher, Release, Distribution, Enterprise, Production, and Platform neutrality on the final production release tree.

The detailed provider receipt is in `docs/runbooks/marketplace-supabase-production.md`.

## Commerce boundary

Paid commerce remains intentionally disabled. The production checkout path returns `COMMERCE_DISABLED`; live Stripe credentials and webhook configuration are not part of this release. Enabling paid launch remains a separate Human Authority decision. Payment success never substitutes for entitlement authority.

## Authority boundary

Canon remains authoritative and cannot be mutated by commerce, Publisher Studio, runtime adapters, or enterprise policy. Enterprise overlays may only narrow authority. I4/consequential actions remain Human Authority even after purchase or installation.
