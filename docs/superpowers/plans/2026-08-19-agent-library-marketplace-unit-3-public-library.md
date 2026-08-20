# Agent Library Marketplace Unit 3 — Public Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn marketplace projection state into a static, searchable, SEO-friendly `/library/` experience where canonical reference entries and commercial products appear automatically without manual storefront duplication.

**Architecture:** Unit 3 adds a deterministic catalog builder and static renderer. Public pages are generated from marketplace read-model JSON and deployed through the existing GitHub Pages/Jekyll workflow. Stateful actions remain links/placeholders to later authenticated APIs; the public Library must continue working from the last-known-good snapshot during backend outages.

**Tech Stack:** Node.js 22 ESM, `node:test`, vanilla HTML/CSS/JS, existing `assets/style.css`, existing GitHub Pages/Jekyll deployment.

**Spec:** Frozen marketplace design + review addendum.

## Global Constraints

- Preserve existing static-site architecture and current `node:test` conventions.
- Public pages consume generated read-model data, never Canon directly.
- `REFERENCE_ONLY` entries may be browsed/searched but must not display purchase/install actions.
- Public metadata uses an allowlist; private/restricted publisher/security fields never enter snapshots.
- Public deployed copy must continue satisfying existing positioning tests; do not use prohibited public terms already enforced by `tests/site-content.test.mjs`.
- Broken local links must fail `tests/site-links.test.mjs`.
- Static generation failure must not replace the last-known-good `library/` tree.

---

### Task 1: Build the public catalog snapshot

**Files:**
- Create: `marketplace/catalog/build-catalog.mjs`
- Create: `marketplace/catalog/public-record.mjs`
- Create: `tests/marketplace/catalog/build-catalog.test.mjs`
- Create: `data/library/catalog.snapshot.json`

**Interfaces:**
- Consumes: Unit 2 products/ProductVersions/reference projections.
- Produces: `buildPublicCatalog(readModel) -> {generated_at, entries, publishers, taxonomy}`.

- [ ] **Step 1: Write failing reference/commercial separation test**

```js
const catalog = buildPublicCatalog({ entries: [
  { id:"ESP-07", commercial_state:"REFERENCE_ONLY", public:true, name:"Security Posture Analyst" },
  { id:"ESP-02", commercial_state:"PAID", public:true, name:"Software Implementation Agent", offer_summary:{currency:"USD", amount:5900} },
]});
assert.equal(catalog.entries[0].commerce, null);
assert.equal(catalog.entries[1].commerce.amount, 5900);
```

- [ ] **Step 2: Run and verify failure**

Run: `node --test tests/marketplace/catalog/build-catalog.test.mjs`
Expected: FAIL.

- [ ] **Step 3: Implement explicit public record projection**

Only include stable ID, type, slug, name, public description, domain, operating class, risk label, use cases, public skills/integrations, public boundaries, compatibility summary, evaluation summary, publisher, commercial state, offer summary, and version summary.

- [ ] **Step 4: Add private-field leak test**

Seed `security_findings`, `payout_state`, and private evaluator notes; assert serialized catalog does not contain those strings.

- [ ] **Step 5: Run tests and commit**

```bash
node --test tests/marketplace/catalog/build-catalog.test.mjs
git add marketplace/catalog data/library/catalog.snapshot.json tests/marketplace/catalog/build-catalog.test.mjs
git commit -m "feat(library): build public catalog snapshot"
```

---

### Task 2: Build intent-aware static search index

**Files:**
- Create: `marketplace/catalog/build-search-index.mjs`
- Create: `tests/marketplace/catalog/search-index.test.mjs`
- Create: `data/library/search-index.json`

**Interfaces:**
- Produces: `buildSearchIndex(catalog)`, `searchIndex(index, query, filters={})`.

- [ ] **Step 1: Write failing search-intent tests**

```js
const results = searchIndex(index, "review my PR");
assert.deepEqual(results.slice(0,2).map((x) => x.id), ["ESP-03", "SKL-027"]);
```

Add `research competitors` fixture expecting research/market-intelligence entries before unrelated writing tools.

- [ ] **Step 2: Run and verify failure**

Run: `node --test tests/marketplace/catalog/search-index.test.mjs`
Expected: FAIL.

- [ ] **Step 3: Implement weighted token index**

Weights: exact stable ID 100; title 30; use cases 20; capabilities 18; domain 12; related Skill/Role IDs 10; description 8; tags 6. Implement deterministic lowercase tokenization and synonym map stored in `data/library/search-synonyms.json`.

- [ ] **Step 4: Add filter tests**

Verify `type`, `domain`, `runtime`, `commercial_state`, and `publisher` filters compose with query search.

- [ ] **Step 5: Run tests and commit**

```bash
node --test tests/marketplace/catalog/search-index.test.mjs
git add marketplace/catalog/build-search-index.mjs data/library/search-index.json data/library/search-synonyms.json tests/marketplace/catalog/search-index.test.mjs
git commit -m "feat(library): add capability-aware static search"
```

---

### Task 3: Add deterministic HTML renderer and route generator

**Files:**
- Create: `marketplace/catalog/render.mjs`
- Create: `marketplace/catalog/templates.mjs`
- Create: `marketplace/bin/build-library.mjs`
- Create: `tests/marketplace/catalog/render.test.mjs`

**Interfaces:**
- CLI: `node marketplace/bin/build-library.mjs --catalog data/library/catalog.snapshot.json --out library`
- Produces: route tree under `library/` plus `library/catalog.json`, `library/search-index.json`.

- [ ] **Step 1: Write failing route-generation test**

```js
const output = renderEntry({ id:"SKL-026", type:"SKILL", slug:"skl-026-code-generation-secure-implementation", name:"Code Generation & Secure Implementation", commercial_state:"PAID" });
assert.match(output, /SKL-026/);
assert.match(output, /Code Generation &amp; Secure Implementation/);
assert.match(output, /\/library\/skills\/skl-026-code-generation-secure-implementation\//);
```

- [ ] **Step 2: Run and verify failure**

Run: `node --test tests/marketplace/catalog/render.test.mjs`
Expected: FAIL.

- [ ] **Step 3: Implement HTML escaping and canonical route mapping**

Map types: `ROLE -> agents`, `SKILL -> skills`, `WORKFLOW_PACK -> packs`, `COLLECTION -> collections`. Generate category indices and one detail page per public entry. Do not inject unescaped source text.

- [ ] **Step 4: Add atomic directory build**

Build into `.library-build-tmp`, run internal link validation, then replace `library/` only when generation succeeds.

- [ ] **Step 5: Run tests and commit**

```bash
node --test tests/marketplace/catalog/render.test.mjs
git add marketplace/catalog/render.mjs marketplace/catalog/templates.mjs marketplace/bin/build-library.mjs tests/marketplace/catalog/render.test.mjs
git commit -m "feat(library): generate static marketplace routes"
```

---

### Task 4: Implement shelf UI, filters, and responsive Library styling

**Files:**
- Create: `assets/library.js`
- Modify: `assets/style.css`
- Create: `tests/marketplace/catalog/library-ui.test.mjs`

**Interfaces:**
- Browser consumes `window.__LIBRARY_INDEX__` emitted by generated page or `/library/search-index.json` when available.
- DOM hooks: `[data-library-search]`, `[data-library-type]`, `[data-library-domain]`, `[data-library-grid]`, `[data-library-result-count]`.

- [ ] **Step 1: Write static UI contract test**

```js
const html = renderLibraryIndex(fixtureCatalog);
assert.match(html, /data-library-search/);
assert.match(html, /data-library-grid/);
assert.match(html, /Browse the Library/);
```

- [ ] **Step 2: Run and verify failure**

Run: `node --test tests/marketplace/catalog/library-ui.test.mjs`
Expected: FAIL.

- [ ] **Step 3: Add visual system styles**

Add `.library-shell`, `.library-shelf`, `.library-volume`, `.library-manual`, `.library-boxed-set`, `.library-collection`, `.library-badge`, `.library-filter-bar`, and responsive grid rules using existing site variables. Do not create a separate CSS theme.

- [ ] **Step 4: Implement progressive enhancement**

If JavaScript fails, generated entries remain visible and category links still work. JavaScript only filters/sorts the already-rendered public list.

- [ ] **Step 5: Run tests and commit**

```bash
node --test tests/marketplace/catalog/library-ui.test.mjs
git add assets/library.js assets/style.css tests/marketplace/catalog/library-ui.test.mjs
git commit -m "feat(library): add shelf browsing interface"
```

---

### Task 5: Render product detail evidence, relationships, and compatibility

**Files:**
- Modify: `marketplace/catalog/templates.mjs`
- Create: `tests/marketplace/catalog/detail-page.test.mjs`

**Interfaces:**
- Detail template consumes public `entry`, `related`, `components`, `compatibility`, `evaluation_summary`, `versions`.

- [ ] **Step 1: Write failing detail-section tests**

```js
assert.match(html, />What it does</);
assert.match(html, />What it does not do</);
assert.match(html, />Included Skills</);
assert.match(html, />Compatibility</);
assert.match(html, />Trust &amp; Verification</);
assert.match(html, />Versions</);
```

- [ ] **Step 2: Add action-state tests**

`REFERENCE_ONLY` must show `Reference only`; `FREE` may show `Add to Library`; `PAID` may show an offer CTA. No entry shows `Install` unless a verified RuntimeDistribution exists.

- [ ] **Step 3: Implement compact capability graph as semantic HTML/SVG**

Use canonical relationship edges to render direct Skill composition and handoffs. Every edge must have text labels so the graph remains accessible.

- [ ] **Step 4: Run tests and commit**

```bash
node --test tests/marketplace/catalog/detail-page.test.mjs
git add marketplace/catalog/templates.mjs tests/marketplace/catalog/detail-page.test.mjs
git commit -m "feat(library): render evidence-rich product pages"
```

---

### Task 6: Integrate Library into the existing Full Stack Assets site

**Files:**
- Modify: `index.html`
- Modify: `sitemap.xml`
- Modify: `tests/site-content.test.mjs`
- Modify: `tests/site-links.test.mjs` only if route handling needs generated directory awareness

**Interfaces:**
- Homepage adds a clear `/library/` discovery path without replacing the current person-first portfolio positioning.

- [ ] **Step 1: Extend existing tests before modifying homepage**

Add assertions that homepage contains one `/library/` link and still has exactly three featured project cards and no `/purchase/` CTA.

- [ ] **Step 2: Run existing tests and verify the new assertion fails**

Run: `node --test tests/site-content.test.mjs tests/site-links.test.mjs`
Expected: FAIL only on missing Library link.

- [ ] **Step 3: Add Library navigation/section**

Use copy such as `Agent & Skill Library` / `Browse governed, portable AI capabilities.` Avoid prohibited deployed-copy terms enforced by current tests.

- [ ] **Step 4: Add `/library/` and generated detail URLs to sitemap generation**

Prefer generator-owned sitemap fragment rather than manually enumerating products.

- [ ] **Step 5: Run complete site tests**

Run: `node --test tests/site-content.test.mjs tests/site-links.test.mjs tests/marketplace/catalog/*.test.mjs`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add index.html sitemap.xml tests/site-content.test.mjs tests/site-links.test.mjs
git commit -m "feat(site): surface the agent and skill library"
```

---

### Task 7: Add build verification before GitHub Pages deployment

**Files:**
- Modify: `.github/workflows/jekyll-gh-pages.yml`
- Create: `.github/workflows/marketplace-library.yml`
- Create: `tests/marketplace/catalog/build-library.test.mjs`

**Interfaces:**
- PR workflow validates generation.
- Pages workflow runs tests and `node marketplace/bin/build-library.mjs` before Jekyll build.

- [ ] **Step 1: Add deterministic build test**

Generate twice from identical input and compare the complete file manifest and file contents excluding explicit generated timestamps.

- [ ] **Step 2: Update Pages build job**

Add Node 22 setup, repository tests, and Library generation before `actions/jekyll-build-pages@v1`.

- [ ] **Step 3: Verify last-known-good behavior**

A failed Library generation must exit nonzero before Pages artifact upload; no partial `_site` deployment occurs.

- [ ] **Step 4: Run repository tests**

Run: `node --test tests/*.test.mjs tests/marketplace/canon/*.test.mjs tests/marketplace/core/*.test.mjs tests/marketplace/catalog/*.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows tests/marketplace/catalog/build-library.test.mjs
git commit -m "ci(library): verify generated catalog before pages deploy"
```

---

### Task 8: Prove automatic shelf growth

**Files:**
- Create: `tests/marketplace/catalog/automatic-volume.acceptance.test.mjs`
- Modify: `README.md`

**Interfaces:**
- End-to-end fixture chain: Canon export -> Unit 1 snapshot/event -> Unit 2 projection -> Unit 3 catalog/render.

- [ ] **Step 1: Add `SKL-046 Repository Archaeology` fixture only to the Canon source fixture**

Do not add any marketplace/static page fixture for SKL-046.

- [ ] **Step 2: Run pipeline in test temp directory**

```js
await importCanon(...);
await projectAll(...);
await buildCatalog(...);
await buildLibrary(...);
assert.equal(existsSync(join(out, "library/skills/skl-046-repository-archaeology/index.html")), true);
```

- [ ] **Step 3: Add update/failure assertions**

Change fixture to 1.1.0 and prove a new ProductVersion appears; break a dependency and prove the prior rendered version remains the active page source.

- [ ] **Step 4: Run full Unit 3 acceptance suite**

Run: `node --test tests/marketplace/catalog/automatic-volume.acceptance.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/marketplace/catalog/automatic-volume.acceptance.test.mjs README.md
git commit -m "test(library): prove canon-driven automatic shelf growth"
```
