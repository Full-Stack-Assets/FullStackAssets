# Marketplace release boundary

The Agentic Capability Library has two intentionally separate production surfaces:

1. **Public static Library:** generated from the Canon-backed public catalog projection and deployed through GitHub Pages.
2. **Dynamic marketplace services:** Customer Library, Publisher Studio, commerce, runtime-distribution state, private enterprise registries, database state, and artifact delivery.

GitHub Pages can deploy the public static Library independently after the Unit 1–3 source, catalog-generation, link, accessibility, and last-known-good checks pass. A backend outage or the absence of a backend deployment must not break public reference browsing.

## Production API decision gate

Production API deployment is a **Human Authority decision gate**, not an implicit implementation default. No compute/runtime provider is selected by this repository. Do not introduce or substitute a provider merely to make the deployment checklist appear complete. Production API deployment requires a separately approved provider adapter and credentials.

Before the dynamic marketplace can be called production-deployed, Human Authority must approve the production provider/runtime adapter and the deployment must have concrete, verified configuration for:

- a compute/runtime provider capable of running the Node.js 22 marketplace API;
- PostgreSQL, including production connection credentials, migration execution, backup/restore evidence, and readiness checks;
- OIDC, including issuer, audience, JWKS URI, redirect/origin configuration, and the application-role mapping used by the marketplace;
- an S3-compatible artifact store, including endpoint, region, bucket, scoped access credentials, immutable object-key behavior, and signed-read validation;
- the public marketplace API origin, TLS, CORS, and browser/auth cookie or bearer-token behavior required by `/my-library/`, Publisher Studio, and enterprise surfaces;
- Stripe production credentials and webhook configuration **only if paid launch is separately approved**. Stripe evidence never substitutes for entitlement authority.

Production secret values must never be committed to this repository.

## Release evidence

The static release and dynamic release are verified independently.

### Public static release

Required evidence includes:

- Canon/public projection checks pass;
- the catalog baseline hash/entry receipt validates;
- Library generation is deterministic;
- the prior live Library remains intact on a failed candidate build;
- site/link/accessibility checks pass;
- the GitHub Pages workflow succeeds on the released commit;
- the live `/library/` surface is fetched after deployment and matches the expected catalog identity.

### Dynamic marketplace release

Before Units 4–8 are described as live production services, required evidence includes:

- the approved provider adapter is implemented and reviewed without changing Canon or marketplace domain semantics;
- PostgreSQL migrations and readiness checks pass against the production database;
- OIDC authentication and organization/publisher isolation are verified on the live service;
- S3-compatible immutable artifact upload/head/signed-read behavior is verified on the live service;
- the Stripe webhook signature path and test/production separation are verified if commerce is enabled;
- the ten marketplace release gates have evidence refs and all return `PASS`;
- Unit 7 compatibility claims correspond to real runtime evaluation receipts rather than marketing declarations;
- Unit 8 enterprise isolation and publisher-governance evidence is complete;
- the final launch evidence bundle contains no missing, `UNKNOWN`, failed, or unresolved critical evidence.

## Authority boundary

Canon remains authoritative and cannot be mutated by commerce, Publisher Studio, runtime adapters, or enterprise policy. Enterprise overlays may only narrow authority. Payment success is evidence, not entitlement authority. I4/consequential actions remain Human Authority even after purchase or installation.

Until the production API decision gate is explicitly resolved and the live dependency receipts above exist, the dynamic system is **implementation-verified but not production-deployed**. That status is intentional and must not be papered over by selecting a new provider without approval.