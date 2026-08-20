# Marketplace dynamic production — Supabase

## Selected production stack

Human Authority approved the production provider choice on 2026-08-20. Dynamic marketplace Units 4–8 use the existing **Full-Stack-Assets** Supabase project (`fbwoqjxgyczsyjkbglbb`) rather than introducing a second portfolio database or replacing the public GitHub Pages architecture.

- **Compute:** Supabase Edge Function `marketplace-api`, acting only as a runtime adapter around the existing Web Request/Response marketplace router and services.
- **PostgreSQL:** the existing Supabase Postgres 17 database. Marketplace migrations remain additive and do not alter the existing BuildGraph knowledge tables.
- **OIDC/JWKS:** Supabase Auth tokens are verified by the existing `jose` OIDC verifier. Application roles and Human Authority grants are persisted separately in marketplace tables; Human Authority is never inferred from an admin or reviewer role.
- **Artifact storage:** private Supabase Storage bucket `marketplace-artifacts`, using the existing S3-compatible, content-addressed artifact contract and short-lived signed reads.
- **Public static Library:** remains independently deployed at `https://fullstackassets.com/library/` by the canonical GitHub Pages host.

## Commerce status

**Paid launch is not enabled.** The production router returns `COMMERCE_DISABLED` for checkout and does not configure a live Stripe adapter or webhook handler. Enabling paid products remains a separate Human Authority decision and requires Stripe production credentials plus live signature/webhook verification.

## Security boundary

Browser clients do not receive direct PostgREST access to marketplace tables. Migration `007_supabase_production_hardening.sql` enables RLS and revokes `anon`/`authenticated` table privileges for marketplace tables only, intentionally leaving pre-existing BuildGraph tables unchanged. The Edge function connects through the provider-supplied database URL and remains responsible for subject, organization, publisher, entitlement, and Human Authority checks already defined by Units 4–8.

The function configuration sets `verify_jwt = false` at the Supabase gateway because the existing router must inspect the Stripe webhook path before user authentication. This does **not** make protected application routes anonymous: the router auth service verifies Bearer JWTs before every protected route.

## Deployment sequence

1. Verify the complete Unit 1–8 + production-adapter test suite.
2. Apply marketplace migrations `001` through `007` in order to project `fbwoqjxgyczsyjkbglbb`.
3. Verify table existence, RLS state, scoped privilege revocation, provider authority tables, and private artifact bucket.
4. Seed only approved first-party/reference data as `REFERENCE_ONLY`. Do not manufacture Offers or VERIFIED runtime claims.
5. Deploy `supabase/functions/marketplace-api` with the existing router/services and provider runtime adapter.
6. Verify `/health`, unauthenticated rejection, positive Supabase OIDC authentication, organization/publisher isolation, Human Authority denial without a grant, private storage signed reads, and readiness evidence.
7. Merge the already-verified Unit 4–8 PR chain only after live production verification succeeds, followed by the production adapter PR.
8. Re-run the full suite on merged `main`, update release documentation, and close the provider-decision issue only when its live evidence requirements are satisfied.

## Rollback

- Edge code rollback: redeploy the previously verified function version or delete/disable the function without affecting the independently served public Library.
- Database rollback: do not destructively drop production tables as an automatic response. Restore from verified database backup/restore evidence or apply a reviewed compensating migration.
- Artifact rollback: content-addressed artifacts are immutable; availability is changed in marketplace records rather than mutating package bytes.
- Auth rollback: revoke marketplace app roles/Human Authority grants in database state without changing Canon.

## Completion evidence required

Dynamic production is complete only when the deployed service and production dependencies have fresh receipts for database readiness, OIDC verification, cross-subject isolation, private artifact signed reads, release gates, runtime compatibility evidence, enterprise governance, and final launch evidence with no unresolved critical or `UNKNOWN` states.
