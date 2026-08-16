# Full Stack Assets Portfolio Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Full Stack Assets into a person-first engineering portfolio led by BeyondMythos, with focused employer and client paths, two service offers, and no patent or COO-flagship positioning.

**Architecture:** Keep the production site's static HTML/CSS/JavaScript architecture and existing navy/amber/cyan design system. Add dependency-free Node test scripts for content, structure, and links; change the site in independently verifiable slices; then run local visual and interaction checks in the in-app Browser before any deployment.

**Tech Stack:** Static HTML5, CSS, browser JavaScript, Node.js built-in `node:test`, Python static server for local preview, cloud deployment static hosting.

## Global Constraints

- Preserve `#0B1426`, `#F2A93B`, and `#62B6CB` as the primary color system.
- Preserve Bricolage Grotesque, Public Sans, and IBM Plex Mono.
- Do not introduce a frontend framework, package manager dependency, server-side form service, or build step.
- Homepage featured order is exactly BeyondMythos, Tradewind DealFlow, TaskFlow.
- The homepage contains exactly three featured projects and no project filter tabs.
- Remove the words `patent`, `patent-pending`, `flagship`, and `sole inventor` from deployed HTML, XML, JavaScript, and structured data, case-insensitively.
- Remove `20+` and `revenue-ready` from primary positioning and metadata.
- Do not claim revenue, customer adoption, audience traction, employment history, education completion, or work authorization without supplied evidence.
- BeyondMythos's 41-site count is operational evidence, not market traction.
- Remove Purchase from global navigation and do not present any service as immediate checkout.
- Primary services are exactly Product and Systems Audit and Fixed-Scope Build Sprint.
- Keep `hello@fullstackassets.com` and `https://github.com/Full-Stack-Assets` as the contact destinations.
- Do not deploy or push until local automated, visual, and interaction verification passes and the user explicitly approves the verified build.

---

## File map

**Create**

- `tests/site-content.test.mjs` — prohibited-copy and required-positioning contract.
- `tests/site-links.test.mjs` — local route, anchor, sitemap, and discovery checks.
- `case-studies/beyondmythos.html` — lead deployment-engine case study.
- `case-studies/tradewind-dealflow.html` — private, sanitized acquisition-operations case study.
- `resume/index.html` — printable professional snapshot.

**Modify**

- `index.html` — homepage metadata, navigation, hero, proof, featured work, capabilities, process, about, services preview, contact, footer, constellation labels.
- `assets/style.css` — audience paths, responsive featured cards, inquiry and résumé layouts, focus states, mobile spacing, reduced motion, print styles.
- `assets/site.js` — remove purchase enhancement, strengthen mobile navigation, add inquiry mail composition and résumé printing.
- `case-studies/index.html` — selected-work hierarchy with BeyondMythos first.
- `case-studies/taskflow.html` — replace volume claims with tested workflow evidence.
- `case-studies/constellation-coo.html` — demote and reframe as an experimental agent-scheduling engine.
- `services/index.html` — exactly two service offers, fit criteria, process, and inquiry CTA.
- `purchase/index.html` — replace checkout with a qualified inquiry form while preserving the route.
- `blog/index.html` — engineering-note positioning and discoverability cleanup.
- `blog/constraint-optimized-orchestration.html` — retain scheduling-engine article without IP positioning.
- `blog/documenting-for-acquisition.html` — reframe around maintainable handoff and operational documentation.
- `blog/shipping-20-microsaas-solo.html` — reframe around a repeatable shipping system without a product-count identity.
- `blog/feed.xml` — aligned descriptions and patent-article removal.
- `sitemap.xml` — add BeyondMythos, Tradewind, and résumé; remove the patent article.
- All other `case-studies/*.html` and `blog/*.html` — align shared navigation and footer copy.
- `assets/og-template.html` — replace asset-sale and patent positioning in the social-card source.

**Delete**

- `blog/patents-for-indie-engineers.html` — remove the deployed article after eliminating every internal, RSS, and sitemap reference.

---

### Task 1: Add the portfolio-positioning contract

**Files:**
- Create: `tests/site-content.test.mjs`
- Test: `tests/site-content.test.mjs`

**Interfaces:**
- Consumes: deployed source files below the repository root, excluding `.git/`, `docs/`, `products/`, and `tests/`.
- Produces: `deployedFiles()`, `read(relativePath)`, and Node test failures that define the overhaul's copy and structure requirements.

- [ ] **Step 1: Write the failing content contract**

Create `tests/site-content.test.mjs` with this complete test harness:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const root = new URL("../", import.meta.url).pathname;
const ignored = new Set([".git", "docs", "products", "tests"]);
const deployedExtensions = new Set([".html", ".xml", ".js"]);

export function read(path) {
  return readFileSync(join(root, path), "utf8");
}

export function deployedFiles(directory = root) {
  return readdirSync(directory).flatMap((name) => {
    if (ignored.has(name)) return [];
    const absolute = join(directory, name);
    if (statSync(absolute).isDirectory()) return deployedFiles(absolute);
    return deployedExtensions.has(extname(name)) ? [relative(root, absolute)] : [];
  });
}

test("deployed copy contains no prohibited positioning", () => {
  const prohibited = [/patent/i, /flagship/i, /sole inventor/i];
  const failures = [];
  for (const file of deployedFiles()) {
    const source = read(file);
    for (const pattern of prohibited) {
      if (pattern.test(source)) failures.push(`${file}: ${pattern}`);
    }
  }
  assert.deepEqual(failures, []);
});

test("homepage is person-first and has exactly three featured projects", () => {
  const home = read("index.html");
  assert.match(home, /Nic Albertson · Full-stack \/ product engineer/);
  assert.match(home, /I turn messy workflows into reliable software/);
  assert.match(home, /Hiring a product engineer/);
  assert.match(home, /Need a system built/);
  const featured = [...home.matchAll(/class="asset featured-project/g)];
  assert.equal(featured.length, 3);
  const positions = ["BeyondMythos", "Tradewind DealFlow", "TaskFlow"].map((name) => home.indexOf(name));
  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
  assert.doesNotMatch(home, /href="\/purchase\//);
});

test("required routes and focused services exist", () => {
  for (const path of [
    "case-studies/beyondmythos.html",
    "case-studies/tradewind-dealflow.html",
    "resume/index.html",
  ]) assert.equal(existsSync(join(root, path)), true, path);
  const services = read("services/index.html");
  assert.match(services, /Product and Systems Audit/);
  assert.match(services, /Fixed-Scope Build Sprint/);
  assert.doesNotMatch(services, /Fractional Founding Engineer|Source License|Acquisition/);
});

test("BeyondMythos copy distinguishes operations from traction", () => {
  const page = read("case-studies/beyondmythos.html");
  assert.match(page, /Autonomous Deployment Engine/);
  assert.match(page, /41/);
  assert.match(page, /operational evidence/i);
  assert.match(page, /not (customer|market) traction/i);
});
```

- [ ] **Step 2: Run the contract and confirm the old site fails**

Run:

```bash
node --test tests/site-content.test.mjs
```

Expected: FAIL for prohibited copy, missing person-first homepage copy, missing featured-project routes, and unfocused services.

- [ ] **Step 3: Commit the failing contract**

```bash
git add tests/site-content.test.mjs
git commit -m "test: define portfolio positioning contract"
```

---

### Task 2: Simplify shared behavior and extend the existing design system

**Files:**
- Modify: `assets/site.js:1-173`
- Modify: `assets/style.css:19-399`
- Test: `tests/site-content.test.mjs`

**Interfaces:**
- Consumes: `.nav-toggle`, `.nav-links`, `.rv`, `.totop`, `[data-inquiry-form]`, `[data-print-resume]`, and existing CSS variables.
- Produces: `composeInquiry(form: HTMLFormElement): string` inside the shared script, accessible mobile navigation, email-based inquiry submission, résumé printing, and reusable layout classes.

- [ ] **Step 1: Add a failing source-level behavior test**

Append to `tests/site-content.test.mjs`:

```js
test("shared behavior has no checkout enhancer and supports inquiry and print", () => {
  const script = read("assets/site.js");
  assert.doesNotMatch(script, /purchase route|begin_checkout|commerceEnhanced/);
  assert.match(script, /data-inquiry-form/);
  assert.match(script, /data-print-resume/);
  assert.match(script, /Escape/);
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
node --test --test-name-pattern="shared behavior" tests/site-content.test.mjs
```

Expected: FAIL because checkout enhancement remains and inquiry/print behavior is absent.

- [ ] **Step 3: Replace commerce behavior with accessible shared behavior**

In `assets/site.js`:

- keep mobile toggle, reveal, back-to-top, tabs, TOC, sharing, and mail conversion tracking;
- remove lines 17-25, 42-82, and 107-117 that inject Purchase links and checkout actions;
- close mobile navigation on `Escape` and return focus to `.nav-toggle`;
- skip `IntersectionObserver` animation when reduced motion is requested;
- add the inquiry handler below; and
- add `[data-print-resume]` click handling with `window.print()`.

Use this exact inquiry composition contract:

```js
function composeInquiry(form) {
  const data = new FormData(form);
  const lines = [
    "PROJECT INQUIRY",
    "",
    `Name: ${data.get("name") || ""}`,
    `Email: ${data.get("email") || ""}`,
    `Company: ${data.get("company") || ""}`,
    `Current system: ${data.get("current-system") || ""}`,
    `Users: ${data.get("users") || ""}`,
    `What is failing: ${data.get("problem") || ""}`,
    `Needed outcome: ${data.get("outcome") || ""}`,
    `Timeline or constraint: ${data.get("timeline") || ""}`,
  ];
  return lines.join("\n");
}

document.querySelectorAll("[data-inquiry-form]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const status = form.querySelector("[aria-live]");
    if (!form.reportValidity()) return;
    const subject = encodeURIComponent("Project inquiry — Full Stack Assets");
    const body = encodeURIComponent(composeInquiry(form));
    if (status) status.textContent = "Opening your email app with the project details.";
    window.location.href = `mailto:hello@fullstackassets.com?subject=${subject}&body=${body}`;
  });
});

document.querySelectorAll("[data-print-resume]").forEach((button) => {
  button.addEventListener("click", () => window.print());
});
```

- [ ] **Step 4: Add reusable CSS without changing the visual identity**

Extend `assets/style.css` with:

```css
:focus-visible{outline:2px solid var(--amber);outline-offset:4px}
.audience-paths,.contact-paths{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
.audience-path,.evidence-card,.resume-block{background:var(--panel);border:1px solid var(--line);padding:28px}
.audience-path{transition:border-color .2s,transform .2s}
.audience-path:hover{border-color:var(--amber);transform:translateY(-3px)}
.audience-path .tag{font-family:'IBM Plex Mono';font-size:.68rem;letter-spacing:.16em;text-transform:uppercase;color:var(--cyan)}
.featured-work{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
.featured-project{min-width:0}
.status-label{font-family:'IBM Plex Mono';font-size:.65rem;letter-spacing:.12em;text-transform:uppercase;color:#7CD992}
.inquiry-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
.inquiry-grid .field-wide{grid-column:1/-1}
.field label{display:block;margin-bottom:7px;font-size:.78rem;color:var(--star)}
.field input,.field textarea{width:100%;border:1px solid var(--line);background:var(--panel-3);color:var(--star);padding:13px 14px;font:inherit}
.field textarea{min-height:140px;resize:vertical}
.field input:focus,.field textarea:focus{border-color:var(--amber);outline:2px solid rgba(242,169,59,.25)}
.form-note,.form-status{color:var(--dim);font-size:.82rem}
.resume-header{display:flex;justify-content:space-between;gap:24px;align-items:flex-start}
.resume-list{display:grid;gap:12px;list-style:none}
@media(max-width:900px){.featured-work{grid-template-columns:1fr}}
@media(max-width:700px){
  .audience-paths,.contact-paths,.inquiry-grid{grid-template-columns:1fr}
  .inquiry-grid .field-wide{grid-column:auto}
  .hero-content{padding:118px 24px 72px}
  .nav-toggle{width:44px;height:44px;display:grid;place-items:center;padding:0}
}
@media(prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  *,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
  .rv{opacity:1;transform:none}
}
@media print{
  nav,footer,.totop,.no-print{display:none!important}
  body{background:#fff;color:#111;font-weight:400}
  .page-hero,section{padding:24px 0;border-color:#ddd}
  .resume-block{background:#fff;border-color:#ddd;break-inside:avoid}
  a{color:#111;text-decoration:none}
}
```

- [ ] **Step 5: Run the focused test and verify it passes**

```bash
node --test --test-name-pattern="shared behavior" tests/site-content.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit shared behavior and styles**

```bash
git add assets/site.js assets/style.css tests/site-content.test.mjs
git commit -m "refactor: focus shared portfolio behavior"
```

---

### Task 3: Rebuild the homepage around role fit and selected work

**Files:**
- Modify: `index.html:1-581`
- Test: `tests/site-content.test.mjs`

**Interfaces:**
- Consumes: existing design classes, new `.audience-paths`, `.featured-work`, and `.featured-project` classes.
- Produces: homepage anchors `#work`, `#capabilities`, `#process`, `#about`, and `#contact`; primary routes to `/services/`, `/resume/`, and featured case studies.

- [ ] **Step 1: Add homepage metadata assertions**

Append:

```js
test("homepage metadata is role-first", () => {
  const home = read("index.html");
  assert.match(home, /<title>Nic Albertson — Full-Stack \/ Product Engineer<\/title>/);
  assert.match(home, /Product-minded full-stack engineer building reliable workflow automation/);
  assert.match(home, /"jobTitle": "Full-Stack \/ Product Engineer"/);
  assert.doesNotMatch(home, /revenue-ready|20\+|acquisition/i);
});
```

- [ ] **Step 2: Run homepage tests and confirm failure**

```bash
node --test --test-name-pattern="homepage" tests/site-content.test.mjs
```

Expected: FAIL on old title, copy, structured data, and project structure.

- [ ] **Step 3: Replace homepage metadata and structured data**

Use exactly:

```html
<title>Nic Albertson — Full-Stack / Product Engineer</title>
<meta name="description" content="Product-minded full-stack engineer building reliable workflow automation, deployment systems, internal tools, and data products. Open to engineering roles and selected client builds.">
```

Set Open Graph and Twitter titles to `Nic Albertson — Full-Stack / Product Engineer`; use the same description. Set Person schema `jobTitle` to `Full-Stack / Product Engineer` and describe workflow, data, and deployment systems. Set WebSite schema to the same person-first positioning.

- [ ] **Step 4: Replace navigation and hero**

Navigation destinations:

```html
<a href="/#work">Work</a>
<a href="/services/">Services</a>
<a href="/#about">About</a>
<a href="/resume/">Résumé</a>
<a href="/#contact" class="nav-cta">Contact</a>
```

Hero copy:

```html
<div class="eyebrow">Nic Albertson · Full-stack / product engineer</div>
<h1>I turn messy workflows into <em>reliable software.</em></h1>
<p class="hero-sub">I design and ship full-stack products, internal tools, and practical automation—from data ingestion and review workflows to autonomous deployment systems. I’m open to product-engineering roles and a small number of fixed-scope client builds.</p>
<div class="hero-ctas">
  <a class="btn btn-solid" href="#work">See selected work</a>
  <a class="btn btn-ghost" href="/resume/">View résumé</a>
  <a class="btn btn-ghost" href="/services/#inquiry">Discuss a project</a>
</div>
```

Change the coordinate caption to `FALL RIVER, MA · OPEN TO ENGINEERING ROLES`.

- [ ] **Step 5: Add the two audience paths and evidence strip**

Use two panels titled `Hiring a product engineer` and `Need a system built`. The first links to `#work` and `/resume/`; the second links to `/services/` and `/services/#inquiry`.

Use four proof cells:

- `41` / `Sites operated by the BeyondMythos engine`
- `Hourly` / `Automated publishing and deployment activity`
- `Tested` / `Workflow, retry, persistence, and metrics behavior`
- `End to end` / `Product, data, infrastructure, and handoff ownership`

- [ ] **Step 6: Replace homepage project inventory with exactly three featured cards**

Each root card must include `class="asset featured-project rv"` and use this order:

1. BeyondMythos — `/case-studies/beyondmythos.html`, status `Production system`, proof `41 sites · 14 mapped domains`, `Hourly workflows`, `Provider fallback · bounded concurrency`.
2. Tradewind DealFlow — `/case-studies/tradewind-dealflow.html`, status `Private system`, proof `Authorized intake`, `Provenance + conflict handling`, `Typed workflow · tests`.
3. TaskFlow — `/case-studies/taskflow.html`, status `Reference implementation`, proof `Typed workflows`, `Retries + persistence + metrics`, `Tested deployment paths`.

Do not include filter tabs on the homepage.

- [ ] **Step 7: Rewrite capabilities, process, About, services preview, and contact**

Capabilities headings:

- Product engineering.
- Workflow and data systems.
- Automation and AI integration.
- Delivery and operations.

Process headings:

- Diagnose the workflow and constraint.
- Design the smallest reliable system.
- Ship with tests and operator documentation.
- Measure failures, recoveries, and outcomes.

About copy must identify Nic as a product-minded engineer in Fall River, Massachusetts and emphasize judgment, communication, and end-to-end ownership. Keep the verified `A.S., AI & Software Engineering (in progress)` fact but do not imply completion.

Services preview contains only Product and Systems Audit and Fixed-Scope Build Sprint. Contact contains `Discuss a role`, `Discuss a project`, `View GitHub`, and `View résumé`.

- [ ] **Step 8: Update footer and constellation labels**

Footer selected work is BeyondMythos, Tradewind DealFlow, and TaskFlow. Footer description:

> Product-minded full-stack engineer building reliable workflow, data, and deployment systems.

Change the constellation `ASSETS` array to:

```js
const ASSETS = ["BEYONDMYTHOS", "TRADEWIND", "TASKFLOW", "WORKFLOWS", "DATA", "DEPLOYMENT"];
```

- [ ] **Step 9: Run homepage tests**

```bash
node --test --test-name-pattern="homepage" tests/site-content.test.mjs
```

Expected: PASS.

- [ ] **Step 10: Commit the homepage overhaul**

```bash
git add index.html tests/site-content.test.mjs
git commit -m "feat: reposition portfolio homepage"
```

---

### Task 4: Publish the selected-work hierarchy and case studies

**Files:**
- Create: `case-studies/beyondmythos.html`
- Create: `case-studies/tradewind-dealflow.html`
- Modify: `case-studies/index.html:1-222`
- Modify: `case-studies/taskflow.html:1-198`
- Modify: `case-studies/constellation-coo.html:1-248`
- Test: `tests/site-content.test.mjs`

**Interfaces:**
- Consumes: existing `.page-hero`, `.case-layout`, `.prose`, `.toc`, `.results`, and shared navigation/footer components.
- Produces: selected-work routes referenced by homepage, footer, sitemap, and résumé.

- [ ] **Step 1: Add focused case-study assertions**

Append:

```js
test("selected case studies use evidence-backed framing", () => {
  const index = read("case-studies/index.html");
  const positions = ["BeyondMythos", "Tradewind DealFlow", "TaskFlow"].map((name) => index.indexOf(name));
  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
  const taskflow = read("case-studies/taskflow.html");
  assert.match(taskflow, /retries/i);
  assert.match(taskflow, /persistence/i);
  assert.match(taskflow, /tests/i);
  assert.doesNotMatch(taskflow, /36K|30 files/i);
  const experiment = read("case-studies/constellation-coo.html");
  assert.match(experiment, /Experimental agent-scheduling engine/);
  assert.match(experiment, /synthetic benchmark/i);
});
```

- [ ] **Step 2: Run the selected-work tests and confirm failure**

```bash
node --test --test-name-pattern="selected case studies|BeyondMythos" tests/site-content.test.mjs
```

Expected: FAIL because new routes are missing and old project claims remain.

- [ ] **Step 3: Create the BeyondMythos case study**

Use title `BeyondMythos Autonomous Deployment Engine` and summary `A production system that generates, validates, deploys, and operates independently branded web properties.`

Use these sections and IDs:

- `#problem` — managing independent sites reliably without repeating operational work.
- `#lifecycle` — configuration → generation → validation → Git commit → per-site deployment → domain operation.
- `#reliability` — provider abstraction, template fallback, bounded concurrency, failure isolation.
- `#operations` — 41 deployed sites, 14 mapped domains, hourly workflows, commerce, fulfillment, subscriber persistence, per-site agents.
- `#testing` — critical-path tests and recovery behavior.
- `#limits` — site count is operational evidence, not customer or market traction; no revenue claim.

Link to `https://beyondmythos.com/` as `Open the live deployment stream`. Describe the repository as private; do not link to a nonexistent public code view.

- [ ] **Step 4: Create the Tradewind DealFlow case study**

Use title `Tradewind DealFlow` and summary `A reviewable acquisition-operations system for authorized intake, source provenance, conflict handling, and controlled follow-up.`

Use sections `#problem`, `#boundaries`, `#workflow`, `#reliability`, and `#status`. Explicitly label it `Private system` and state that examples are sanitized. Do not claim a public demo.

- [ ] **Step 5: Rewrite the work index**

Lead with three expanded cards in approved order. Place HostGraph, VERITAS, and other credible supporting work in a `Supporting work` section with honest status labels. Place the scheduling experiment in `Experiments and archive`; do not use it in the page hero or primary footer.

- [ ] **Step 6: Update TaskFlow and Constellation**

For TaskFlow, replace file/documentation volume with typed workflow definitions, retries, persistence, metrics, contract/HTTP behavior, tests, and deployment documentation.

For Constellation, use title and page heading `Experimental agent-scheduling engine`. Preserve benchmark numbers only with `synthetic benchmark` and limitations beside them. Replace byline role with `Product and engineering`.

- [ ] **Step 7: Run case-study tests**

```bash
node --test --test-name-pattern="selected case studies|BeyondMythos" tests/site-content.test.mjs
```

Expected: PASS.

- [ ] **Step 8: Commit selected work**

```bash
git add case-studies tests/site-content.test.mjs
git commit -m "feat: lead portfolio with selected systems"
```

---

### Task 5: Replace checkout-first services with qualified inquiry

**Files:**
- Modify: `services/index.html:1-348`
- Modify: `purchase/index.html:1-521`
- Test: `tests/site-content.test.mjs`

**Interfaces:**
- Consumes: shared `[data-inquiry-form]` handler and `.inquiry-grid` form styles.
- Produces: `/services/#inquiry` and a backwards-compatible `/purchase/` inquiry route.

- [ ] **Step 1: Add service and inquiry assertions**

Append:

```js
test("purchase route is a transparent project inquiry", () => {
  const inquiry = read("purchase/index.html");
  assert.match(inquiry, /Tell me what is slowing the team down/);
  assert.match(inquiry, /data-inquiry-form/);
  for (const name of ["current-system", "users", "problem", "outcome", "timeline"]) {
    assert.match(inquiry, new RegExp(`name="${name}"`));
  }
  assert.match(inquiry, /opens your email app/i);
  assert.doesNotMatch(inquiry, /checkout|payment|invoice|purchase audit/i);
});
```

- [ ] **Step 2: Run inquiry tests and confirm failure**

```bash
node --test --test-name-pattern="services|purchase route" tests/site-content.test.mjs
```

Expected: FAIL on the seven-offer and checkout experience.

- [ ] **Step 3: Rewrite Services around two offers**

Page hero: `Focused engineering help for a system that needs to work.`

Offer 1: `Product and Systems Audit`, with architecture/workflow review, bottleneck findings, prioritized plan, delivery estimate, and walkthrough.

Offer 2: `Fixed-Scope Build Sprint`, with working software in the client's environment, critical tests, deployment/operator documentation, and post-launch support.

Add good-fit criteria: fragile manual workflows, expensive API behavior, broken data flow, one bounded product or internal-tool problem. Add not-a-fit criteria: staff augmentation without a defined outcome, speculative mass-content schemes, and projects requiring unsupported legal or regulated-domain guarantees.

Add a four-step process: diagnose, agree scope, ship visibly, hand off clearly. Embed the inquiry form and link each offer to `#inquiry`.

- [ ] **Step 4: Replace the Purchase route**

Retain `/purchase/` to avoid a broken historical URL, but change title to `Project Inquiry | Nic Albertson`. Use heading `Tell me what is slowing the team down.`

Create labeled fields with exact names: `name`, `email`, `company`, `current-system`, `users`, `problem`, `outcome`, and `timeline`. Explain: `Submitting opens your email app with these details. Nothing is sent or stored by this website.` Provide a direct email fallback.

- [ ] **Step 5: Run service and inquiry tests**

```bash
node --test --test-name-pattern="services|purchase route" tests/site-content.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit the focused service funnel**

```bash
git add services/index.html purchase/index.html tests/site-content.test.mjs
git commit -m "feat: replace checkout with qualified inquiry"
```

---

### Task 6: Add a factual printable résumé route

**Files:**
- Create: `resume/index.html`
- Modify: `assets/site.js`
- Modify: `assets/style.css`
- Test: `tests/site-content.test.mjs`

**Interfaces:**
- Consumes: `[data-print-resume]` shared behavior and `.resume-block` print styles.
- Produces: `/resume/` route linked from homepage and global navigation.

- [ ] **Step 1: Add résumé assertions**

Append:

```js
test("resume is factual, printable, and linked", () => {
  const resume = read("resume/index.html");
  assert.match(resume, /Nic Albertson/);
  assert.match(resume, /Full-Stack \/ Product Engineer/);
  assert.match(resume, /Fall River, Massachusetts/);
  assert.match(resume, /BeyondMythos/);
  assert.match(resume, /Tradewind DealFlow/);
  assert.match(resume, /TaskFlow/);
  assert.match(resume, /data-print-resume/);
  assert.doesNotMatch(resume, /work authorization|Bachelor|revenue|customers/i);
});
```

- [ ] **Step 2: Run the résumé test and confirm failure**

```bash
node --test --test-name-pattern="resume" tests/site-content.test.mjs
```

Expected: FAIL because the route does not exist.

- [ ] **Step 3: Create the résumé page**

Include:

- Name, title, Fall River location, email, GitHub, and portfolio URL.
- Summary: `Product-minded full-stack engineer who turns messy operational workflows into reliable, deployable software.`
- Selected systems: BeyondMythos, Tradewind DealFlow, TaskFlow.
- Capabilities: TypeScript/JavaScript, Python, React/Next.js, APIs/data intake, tests, CI/CD, cloud deployment, workflow automation, AI provider integration.
- Education: `A.S., AI & Software Engineering — in progress` only.
- A `Print / Save as PDF` button with `data-print-resume` and `class="btn btn-solid no-print"`.

Do not create chronological employment entries without supplied facts.

- [ ] **Step 4: Run the résumé test**

```bash
node --test --test-name-pattern="resume" tests/site-content.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit the résumé route**

```bash
git add resume/index.html assets/site.js assets/style.css tests/site-content.test.mjs
git commit -m "feat: add printable engineering resume"
```

---

### Task 7: Remove legacy positioning from discovery and shared chrome

**Files:**
- Delete: `blog/patents-for-indie-engineers.html`
- Modify: `blog/index.html`
- Modify: `blog/feed.xml`
- Modify: `blog/constraint-optimized-orchestration.html`
- Modify: `blog/documenting-for-acquisition.html`
- Modify: `blog/shipping-20-microsaas-solo.html`
- Modify: `case-studies/autoblog-pipeline.html`
- Modify: `case-studies/cipherhorizon.html`
- Modify: `case-studies/dropkit.html`
- Modify: `case-studies/hostgraph.html`
- Modify: `case-studies/scanline.html`
- Modify: `case-studies/storeforge.html`
- Modify: `case-studies/veritas.html`
- Modify: `case-studies/vibecoderz.html`
- Modify: `assets/og-template.html`
- Modify: `sitemap.xml`
- Test: `tests/site-content.test.mjs`

**Interfaces:**
- Consumes: global navigation/footer contract and new routes from Tasks 3-6.
- Produces: consistent discoverable copy across all deployed pages and feeds.

- [ ] **Step 1: Add discovery assertions**

Append:

```js
test("discovery files expose the new portfolio hierarchy", () => {
  const sitemap = read("sitemap.xml");
  for (const route of [
    "/case-studies/beyondmythos.html",
    "/case-studies/tradewind-dealflow.html",
    "/resume/",
  ]) assert.match(sitemap, new RegExp(route.replaceAll("/", "\\/")));
  assert.doesNotMatch(sitemap, /patents-for-indie-engineers|\/purchase\//i);
  const feed = read("blog/feed.xml");
  assert.doesNotMatch(feed, /patent|20\+|already for sale/i);
  assert.equal(existsSync(join(root, "blog/patents-for-indie-engineers.html")), false);
});
```

- [ ] **Step 2: Run discovery and prohibited-copy tests**

```bash
node --test --test-name-pattern="discovery|prohibited" tests/site-content.test.mjs
```

Expected: FAIL with a complete list of remaining legacy sources.

- [ ] **Step 3: Remove the patent article and every reference**

Delete `blog/patents-for-indie-engineers.html`. Remove its card from `blog/index.html`, item from `blog/feed.xml`, URL from `sitemap.xml`, related-post cards, inline links, and metadata references.

- [ ] **Step 4: Reframe remaining articles**

- Constraint article: engineering tradeoffs, synthetic benchmark limitations, scheduling reliability; no IP filing explanation.
- Documentation article: rename visible heading to `Documenting Software So Another Engineer Can Run It`; focus on architecture reasoning, deployment, tests, and handoff.
- Shipping article: rename visible heading to `A Repeatable System for Shipping Small Products`; focus on scope, instrument, document, decide; remove numeric catalog identity.

Update feed titles, descriptions, and page metadata to match.

- [ ] **Step 5: Align shared navigation and footer across every secondary page**

Use the same global navigation from Task 3. Use footer description `Product-minded full-stack engineer building reliable workflow, data, and deployment systems.` Use selected-work links for BeyondMythos, Tradewind, and TaskFlow. Remove license/acquisition links and `Built solo` captions.

For secondary case-study contact blocks, use `Discuss a role`, `Discuss a project`, or `Ask about this build`; never `Request a data room`, `License`, or `Acquire`.

- [ ] **Step 6: Update sitemap and social-card source**

Add BeyondMythos, Tradewind, and résumé to `sitemap.xml`. Keep `/purchase/` out of the sitemap because it is a compatibility route; link to `/services/#inquiry` instead. Set current project routes to monthly change frequency.

Update `assets/og-template.html` to person-first engineering copy and remove asset-sale language.

- [ ] **Step 7: Run discovery and prohibited-copy tests**

```bash
node --test --test-name-pattern="discovery|prohibited" tests/site-content.test.mjs
```

Expected: PASS with no deployed source containing prohibited positioning.

- [ ] **Step 8: Commit legacy cleanup**

```bash
git add -A blog case-studies assets/og-template.html sitemap.xml tests/site-content.test.mjs
git commit -m "content: remove legacy asset-sale positioning"
```

---

### Task 8: Validate local links, anchors, interactions, and responsive presentation

**Files:**
- Create: `tests/site-links.test.mjs`
- Modify: any HTML/CSS/JS file with a discovered defect.
- Test: `tests/site-content.test.mjs`
- Test: `tests/site-links.test.mjs`

**Interfaces:**
- Consumes: all completed static routes.
- Produces: a green automated suite and browser-verified desktop/mobile build ready for user review.

- [ ] **Step 1: Write the local-link test**

Create `tests/site-links.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, normalize, relative } from "node:path";

const root = new URL("../", import.meta.url).pathname;
const ignored = new Set([".git", "docs", "products", "tests"]);

function htmlFiles(directory = root) {
  return readdirSync(directory).flatMap((name) => {
    if (ignored.has(name)) return [];
    const absolute = join(directory, name);
    if (statSync(absolute).isDirectory()) return htmlFiles(absolute);
    return extname(name) === ".html" ? [absolute] : [];
  });
}

function destinationFor(file, href) {
  const withoutQuery = href.split(/[?#]/)[0];
  if (!withoutQuery) return file;
  const absolute = withoutQuery.startsWith("/")
    ? join(root, withoutQuery)
    : normalize(join(dirname(file), withoutQuery));
  if (extname(absolute)) return absolute;
  return join(absolute, "index.html");
}

test("all local links resolve", () => {
  const failures = [];
  for (const file of htmlFiles()) {
    const source = readFileSync(file, "utf8");
    const hrefs = [...source.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
    for (const href of hrefs) {
      if (/^(https?:|mailto:|tel:|data:|#)/.test(href)) continue;
      const destination = destinationFor(file, href);
      if (!existsSync(destination)) failures.push(`${relative(root, file)} -> ${href}`);
    }
  }
  assert.deepEqual(failures, []);
});

test("same-page anchors exist", () => {
  const failures = [];
  for (const file of htmlFiles()) {
    const source = readFileSync(file, "utf8");
    for (const [, id] of source.matchAll(/href="#([^"]+)"/g)) {
      if (!new RegExp(`id=["']${id}["']`).test(source)) failures.push(`${relative(root, file)}#${id}`);
    }
  }
  assert.deepEqual(failures, []);
});
```

- [ ] **Step 2: Run all automated checks**

```bash
node --test tests/site-content.test.mjs tests/site-links.test.mjs
```

Expected: PASS. If a failure names a file or route, correct only that defect and rerun until green.

- [ ] **Step 3: Run direct prohibited-copy and diff checks**

```bash
rg -n -i "patent|flagship|sole inventor" --glob '*.html' --glob '*.xml' --glob '*.js' --glob '!docs/**' --glob '!products/**' --glob '!tests/**'
git diff --check
```

Expected: `rg` produces no matches and `git diff --check` produces no output.

- [ ] **Step 4: Start the local static server**

```bash
python3 -m http.server 4173
```

Expected: server listens on port 4173 from the repository root. Keep the process running for browser verification.

- [ ] **Step 5: Verify desktop presentation in the in-app Browser**

At a 1440×1000 viewport, inspect:

- `/` — hero, audience paths, proof, three featured projects, services preview, contact, footer.
- `/case-studies/beyondmythos.html` — content hierarchy, long-form readability, live link.
- `/case-studies/tradewind-dealflow.html` — private/sanitized labels.
- `/services/` and `/purchase/` — two offers and inquiry form.
- `/resume/` — printable hierarchy.

Check borders, padding, line length, font weights, card alignment, focus states, and that no artwork competes with text.

- [ ] **Step 6: Verify mobile presentation and interactions**

At a 390×844 viewport:

- confirm the 44×44 navigation control;
- open and close navigation, verify `aria-expanded`, close with Escape, and follow each primary link;
- confirm the hero has side padding and canvas labels do not overlap copy;
- confirm all project and audience grids collapse to one column;
- submit the inquiry form with realistic test data and confirm a correctly encoded `mailto:` destination is produced without storing data;
- activate `Print / Save as PDF` and confirm the print dialog path and print stylesheet.

- [ ] **Step 7: Compare old and new homepage visual identity**

Place the original audit capture `../fullstackassets-audit-2026-07-29/01-home-desktop.png` beside a new 1440-pixel-wide homepage screenshot. Confirm the palette, typography, line treatment, constellation motif, and panel language remain recognizable while hero messaging and project hierarchy are visibly different.

- [ ] **Step 8: Rerun the complete suite after visual fixes**

```bash
node --test tests/site-content.test.mjs tests/site-links.test.mjs
git diff --check
git status --short
```

Expected: all tests PASS; diff check is silent; status lists only intended implementation files.

- [ ] **Step 9: Commit the verified rebuild**

```bash
git add tests/site-links.test.mjs index.html assets services purchase resume case-studies blog sitemap.xml
git commit -m "test: verify rebuilt portfolio experience"
```

- [ ] **Step 10: Stop before deployment**

Return the local preview, verification results, changed-file summary, and screenshots to the user. Do not push, open a PR, or deploy until the user explicitly approves the verified implementation.

