# Agent Library Marketplace Unit 4 — Customer Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add authenticated customer/organization accounts, entitlement resolution, authorized artifact access, version pinning, installation/update state, and a persistent `/my-library/` UI without coupling commercial access to any single identity, storage, or payment provider.

**Architecture:** Unit 4 introduces the first persistent API service. Core business rules remain pure ESM modules; adapters provide PostgreSQL, OIDC/JWT verification, and artifact storage. The static site calls the API for stateful operations while public browsing remains static. Entitlement is the sole commercial access authority.

**Tech Stack:** Node.js 22 ESM, `node:test`, PostgreSQL, vanilla HTML/CSS/JS. Add exact npm locks at execution for `pg` and `jose`; keep adapter interfaces provider-neutral.

**Spec:** Frozen marketplace design + review addendum.

## Global Constraints

- Customer entitlement is distinct from Agent authority.
- Payment-provider state is not entitlement state.
- Marketplace app roles (`CUSTOMER`, `ORG_ADMIN`, etc.) are not canonical Agent RoleDefinitions.
- Authenticated downloads require an active entitlement and allowed ProductVersion/RuntimeDistribution.
- Universal/runtime artifacts are immutable and addressed by ProductVersion + hash.
- No customer may access publisher-private, security-sensitive, or another organization’s data.
- Public pages must continue functioning without this API.

---

### Task 1: Scaffold the marketplace API service and pure request router

**Files:**
- Create: `apps/marketplace-api/package.json`
- Create: `apps/marketplace-api/src/server.mjs`
- Create: `apps/marketplace-api/src/router.mjs`
- Create: `apps/marketplace-api/src/http.mjs`
- Create: `tests/marketplace/api/router.test.mjs`

**Interfaces:**
- Produces: `createRouter({services})`, `startServer({port, router})`.
- Route contract initially exposes `GET /health` and `GET /v1/me`.

- [ ] **Step 1: Write failing router tests**

```js
const router = createRouter({ services: {} });
const response = await router(new Request("http://local/health"));
assert.equal(response.status, 200);
assert.deepEqual(await response.json(), { status: "ok" });
```

- [ ] **Step 2: Run and verify failure**

Run: `node --test tests/marketplace/api/router.test.mjs`
Expected: FAIL.

- [ ] **Step 3: Implement Web-Request/Web-Response router**

Keep routing independent of `node:http` so alternate runtime adapters can reuse the same handler. `server.mjs` adapts Node `IncomingMessage` to a Web `Request` and writes the Web `Response` back.

- [ ] **Step 4: Add exact dependency install command**

```bash
cd apps/marketplace-api
npm init -y
npm pkg set type=module engines.node='>=22'
npm install --save-exact pg jose
```

Commit `package-lock.json`.

- [ ] **Step 5: Run tests and commit**

```bash
node --test tests/marketplace/api/router.test.mjs
git add apps/marketplace-api tests/marketplace/api/router.test.mjs
git commit -m "feat(marketplace-api): scaffold portable request router"
```

---

### Task 2: Add customer relational schema and PostgreSQL repository adapter

**Files:**
- Create: `marketplace/db/migrations/002_customer_library.sql`
- Create: `apps/marketplace-api/src/db/postgres.mjs`
- Create: `apps/marketplace-api/src/db/customer-repository.mjs`
- Create: `tests/marketplace/api/customer-schema.test.mjs`

**Interfaces:**
- Tables: `users`, `organizations`, `memberships`, `purchases`, `subscriptions`, `entitlements`, `installations`, `collections`, `collection_items`, `update_preferences`.
- Repository methods: `getUser(id)`, `getOrganization(id)`, `listMemberships(userId)`, `listEntitlements(subject)`, `getEntitlement(id)`, `upsertInstallation(record)`, `listCollections(subject)`.

- [ ] **Step 1: Write failing schema contract tests**

Assert all tables exist; `memberships` has unique `(organization_id,user_id)`; `entitlements` references `products`; `installations` references ProductVersion/RuntimeDistribution; organization-scoped foreign keys exist.

- [ ] **Step 2: Run and verify failure**

Run: `node --test tests/marketplace/api/customer-schema.test.mjs`
Expected: FAIL.

- [ ] **Step 3: Write migration**

Use uppercase enum checks. Store external identity provider subject separately from internal user ID. Never use email address as the primary key.

- [ ] **Step 4: Implement PostgreSQL repository with parameterized SQL only**

No string interpolation of user-controlled values into SQL. Wrap query execution behind `query(text, params)`.

- [ ] **Step 5: Run contract tests and commit**

```bash
node --test tests/marketplace/api/customer-schema.test.mjs
git add marketplace/db/migrations/002_customer_library.sql apps/marketplace-api/src/db tests/marketplace/api/customer-schema.test.mjs
git commit -m "feat(marketplace-api): add customer persistence contract"
```

---

### Task 3: Implement OIDC authentication and application authorization

**Files:**
- Create: `apps/marketplace-api/src/auth/oidc.mjs`
- Create: `apps/marketplace-api/src/auth/authorize.mjs`
- Create: `tests/marketplace/api/auth.test.mjs`

**Interfaces:**
- Produces: `verifyAccessToken(token, config) -> {sub, issuer, audience, email?}`; `requireAppRole(context, allowedRoles)`.
- Configuration: `OIDC_ISSUER`, `OIDC_AUDIENCE`, `OIDC_JWKS_URI`.

- [ ] **Step 1: Write authorization tests before token verification integration**

```js
assert.doesNotThrow(() => requireAppRole({roles:["CUSTOMER"]}, ["CUSTOMER"]));
assert.throws(() => requireAppRole({roles:["CUSTOMER"]}, ["PUBLISHER_ADMIN"]), /FORBIDDEN/);
```

- [ ] **Step 2: Add OIDC token fixture with local test key**

Generate a test-only RSA keypair in test setup, sign a JWT with `jose`, and verify issuer/audience/expiry failures.

- [ ] **Step 3: Implement strict verification**

Reject missing issuer/audience, expired tokens, unknown key IDs, and tokens with algorithms outside the configured allowlist.

- [ ] **Step 4: Run tests and commit**

```bash
node --test tests/marketplace/api/auth.test.mjs
git add apps/marketplace-api/src/auth tests/marketplace/api/auth.test.mjs
git commit -m "feat(marketplace-api): enforce oidc application identity"
```

---

### Task 4: Implement entitlement resolution as the sole access authority

**Files:**
- Create: `marketplace/customer/entitlements.mjs`
- Create: `tests/marketplace/customer/entitlements.test.mjs`

**Interfaces:**
- Produces: `resolveEntitlement({entitlements, product, version, runtime, now}) -> {allowed, entitlement_id, reason, max_version_policy}`.

- [ ] **Step 1: Write perpetual/subscription/version-pin tests**

```js
assert.equal(resolveEntitlement({
  entitlements:[{id:"ENT-1",status:"ACTIVE",product_id:"PRD-1",version_policy:"MAJOR_PINNED",acquired_version:"1.4.0",expires_at:null}],
  product:{id:"PRD-1"}, version:{version:"1.4.2"}, runtime:"UNIVERSAL", now:new Date("2026-08-19T12:00:00Z"),
}).allowed, true);
```

Add failures for `2.0.0`, expired subscriptions, suspended entitlements, and wrong organization.

- [ ] **Step 2: Run and verify failure**

Run: `node --test tests/marketplace/customer/entitlements.test.mjs`
Expected: FAIL.

- [ ] **Step 3: Implement exact version-policy comparator**

Support `EXACT`, `PATCH_PINNED`, `MINOR_PINNED`, `MAJOR_PINNED`, `CURRENT_WHILE_ACTIVE` with semantic version tuples; reject malformed versions.

- [ ] **Step 4: Run tests and commit**

```bash
node --test tests/marketplace/customer/entitlements.test.mjs
git add marketplace/customer/entitlements.mjs tests/marketplace/customer/entitlements.test.mjs
git commit -m "feat(marketplace): resolve customer entitlements"
```

---

### Task 5: Add artifact-store abstraction and authorized download flow

**Files:**
- Create: `apps/marketplace-api/src/artifacts/store.mjs`
- Create: `apps/marketplace-api/src/artifacts/filesystem-store.mjs`
- Create: `apps/marketplace-api/src/services/downloads.mjs`
- Create: `tests/marketplace/api/downloads.test.mjs`

**Interfaces:**
- `ArtifactStore.getMetadata(artifactId)`
- `ArtifactStore.createReadGrant(artifactId, {subject, expiresInSeconds})`
- `authorizeDownload(context, productVersionId, runtime)`.

- [ ] **Step 1: Write unauthorized/authorized tests**

Assert no entitlement returns 403 and never calls `createReadGrant`; valid entitlement returns metadata plus a short-lived grant.

- [ ] **Step 2: Add hash verification test**

Filesystem adapter computes SHA-256 and rejects files whose bytes do not match stored artifact hash.

- [ ] **Step 3: Implement provider-neutral interface**

Production S3-compatible adapter is a later deployment adapter; Unit 4 ships filesystem adapter for tests/dev and the stable interface consumed by service logic.

- [ ] **Step 4: Run tests and commit**

```bash
node --test tests/marketplace/api/downloads.test.mjs
git add apps/marketplace-api/src/artifacts apps/marketplace-api/src/services/downloads.mjs tests/marketplace/api/downloads.test.mjs
git commit -m "feat(marketplace-api): authorize immutable artifact downloads"
```

---

### Task 6: Add customer API endpoints

**Files:**
- Modify: `apps/marketplace-api/src/router.mjs`
- Create: `apps/marketplace-api/src/services/customer-library.mjs`
- Create: `tests/marketplace/api/customer-library.test.mjs`

**Interfaces:**
- `GET /v1/me`
- `GET /v1/library`
- `GET /v1/library/updates`
- `POST /v1/installations`
- `POST /v1/collections`
- `POST /v1/collections/:id/items`
- `GET /v1/products/:id/versions/:version/download?runtime=...`

- [ ] **Step 1: Write auth-required endpoint tests**

Unauthenticated requests must return 401; authenticated user with no entitlements receives `[]`, never another user’s data.

- [ ] **Step 2: Write organization isolation test**

A user in Org A cannot enumerate Org B entitlements by changing URL/body IDs.

- [ ] **Step 3: Implement service functions with repository subject scoping**

Every query takes `subject` from verified auth context, not from arbitrary request body except when an authorized `ORG_ADMIN` selects an organization they belong to.

- [ ] **Step 4: Run tests and commit**

```bash
node --test tests/marketplace/api/customer-library.test.mjs
git add apps/marketplace-api/src/router.mjs apps/marketplace-api/src/services/customer-library.mjs tests/marketplace/api/customer-library.test.mjs
git commit -m "feat(marketplace-api): expose customer library endpoints"
```

---

### Task 7: Build `/my-library/` static application shell

**Files:**
- Create: `my-library/index.html`
- Create: `my-library/owned/index.html`
- Create: `my-library/installed/index.html`
- Create: `my-library/collections/index.html`
- Create: `my-library/updates/index.html`
- Create: `my-library/licenses/index.html`
- Create: `assets/my-library.js`
- Modify: `assets/style.css`
- Create: `tests/marketplace/customer/my-library-ui.test.mjs`

**Interfaces:**
- Browser API base from `<meta name="marketplace-api-base" content="...">` or same-origin default.
- Renders owned/installed/update/license states from authenticated API JSON.

- [ ] **Step 1: Write static route/UI tests**

Assert all six routes exist, share skip-link/nav/footer structure, contain loading/error/empty states, and never embed entitlement data at build time.

- [ ] **Step 2: Run and verify failure**

Run: `node --test tests/marketplace/customer/my-library-ui.test.mjs`
Expected: FAIL.

- [ ] **Step 3: Implement accessible application shell**

Use existing CSS variables and patterns. Provide visible states: `Sign in required`, `Loading`, `No products yet`, `Update available`, `Runtime unavailable`, `License expired`.

- [ ] **Step 4: Add fetch error behavior**

Do not erase last rendered state on transient API failure; show a retry control and timestamp of last successful response in memory for the current page session.

- [ ] **Step 5: Run site/link tests and commit**

```bash
node --test tests/site-links.test.mjs tests/marketplace/customer/my-library-ui.test.mjs
git add my-library assets/my-library.js assets/style.css tests/marketplace/customer/my-library-ui.test.mjs
git commit -m "feat(library): add authenticated customer library shell"
```

---

### Task 8: Implement update and installation state semantics

**Files:**
- Create: `marketplace/customer/updates.mjs`
- Create: `marketplace/customer/installations.mjs`
- Create: `tests/marketplace/customer/updates.test.mjs`

**Interfaces:**
- Produces: `computeUpdateState({ownedVersion, activeVersion, entitlement, compatibility})` returning `CURRENT | UPDATE_AVAILABLE | BREAKING_UPDATE_AVAILABLE | SECURITY_UPDATE | DEPRECATED | RETIRED | INCOMPATIBLE_RUNTIME`.

- [ ] **Step 1: Write all seven state tests**

Each machine state gets one exact fixture; a security-blocked installed version must return `SECURITY_UPDATE` when a remediation version exists.

- [ ] **Step 2: Implement deterministic precedence**

Precedence: `SECURITY_UPDATE` > `RETIRED` > `DEPRECATED` > `INCOMPATIBLE_RUNTIME` > `BREAKING_UPDATE_AVAILABLE` > `UPDATE_AVAILABLE` > `CURRENT`.

- [ ] **Step 3: Run tests and commit**

```bash
node --test tests/marketplace/customer/updates.test.mjs
git add marketplace/customer tests/marketplace/customer/updates.test.mjs
git commit -m "feat(marketplace): compute install and update state"
```

---

### Task 9: Add Unit 4 security/acceptance CI

**Files:**
- Create: `.github/workflows/marketplace-customer.yml`
- Create: `tests/marketplace/customer/access-isolation.acceptance.test.mjs`
- Modify: `README.md`

**Interfaces:**
- CI runs customer/API tests plus all prior marketplace suites.

- [ ] **Step 1: Add access-isolation acceptance matrix**

Cases: public user, Customer A, Customer B, Org A member, Org A admin, Publisher member. Verify each forbidden cross-subject read/write returns 401/403 and records no mutation.

- [ ] **Step 2: Add entitlement-download acceptance test**

Acquire a test entitlement directly in repository fixture; verify authorized universal package grant succeeds and non-owned runtime package is denied.

- [ ] **Step 3: Add workflow and run full suite**

Run: `node --test tests/*.test.mjs tests/marketplace/**/*.test.mjs`
Expected: PASS under shell glob expansion; if CI shell does not expand `**`, list test directories explicitly.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/marketplace-customer.yml tests/marketplace/customer README.md
git commit -m "ci(marketplace): gate customer entitlement isolation"
```
