# Full Stack Assets portfolio overhaul design

Date: July 29, 2026  
Repository: `Full-Stack-Assets/FullStackAssets`  
Production site: `https://fullstackassets.com/`

## Objective

Reposition Full Stack Assets as Nic Albertson's professional engineering portfolio, optimized for two outcomes:

1. Earn interviews for product-minded full-stack engineering roles.
2. Generate qualified inquiries for focused professional development services.

The site must present entrepreneurship and end-to-end product ownership as evidence of engineering ability. It must not present Nic primarily as a patent strategist, software-asset seller, acquisition operator, or owner of a large micro-SaaS catalog.

## Fixed decisions

- Preserve the existing navy, amber, and cyan visual identity.
- Preserve the Bricolage Grotesque, Public Sans, and IBM Plex Mono typography.
- Preserve the static HTML, CSS, and JavaScript architecture.
- Do not migrate the site to a JavaScript framework.
- Make BeyondMythos Autonomous Deployment Engine the lead project.
- Feature Tradewind DealFlow and TaskFlow alongside BeyondMythos.
- Remove patent claims and all statements that Constellation COO is the flagship or main project.
- Keep the current GitHub account and position it as a person-first engineering profile.
- Remove Purchase from global navigation.
- Reduce public services to a product and systems audit plus a fixed-scope build sprint.

## Audiences and conversion goals

### Hiring audience

Primary visitors:

- engineering managers;
- technical founders;
- recruiters for product/full-stack roles;
- early-stage product leaders.

Primary conversion:

- view selected work;
- inspect engineering evidence;
- open GitHub;
- view or print the résumé page;
- send a role-related email.

### Services audience

Primary visitors:

- founders;
- operators;
- small product teams with fragile internal workflows;
- teams needing one bounded system or feature delivered.

Primary conversion:

- understand the two offers;
- determine fit;
- submit a scoped project inquiry.

## Information architecture

Global navigation:

1. Work
2. Services
3. About
4. Résumé
5. Contact

Routes:

- `/` — primary portfolio and conversion page.
- `/case-studies/` — selected work and supporting project index.
- `/case-studies/beyondmythos.html` — lead case study.
- `/case-studies/taskflow.html` — featured case study.
- `/case-studies/constellation-coo.html` — retained but reframed experimental project.
- `/services/` — two focused service offers and fit criteria.
- `/purchase/` — replaced with a project-inquiry page or redirected to the inquiry section on `/services/`.
- `/resume/` — printable professional snapshot.
- `/blog/` — engineering notes with patent and acquisition positioning removed.

Existing secondary case-study routes may remain accessible, but only evidence-backed work appears in featured placement.

## Homepage design

### Hero

Eyebrow:

> Nic Albertson · Full-stack / product engineer

Headline:

> I turn messy workflows into reliable software.

Supporting copy:

> I design and ship full-stack products, internal tools, and practical automation—from data ingestion and review workflows to autonomous deployment systems. I’m open to product-engineering roles and a small number of fixed-scope client builds.

Calls to action:

- `See selected work` — primary.
- `View résumé` — secondary.
- `Discuss a project` — secondary.

The constellation canvas may remain as ambient brand artwork, but it must not overlap or compete with the mobile headline.

### Audience paths

Two compact panels directly below the hero:

- `Hiring a product engineer` — links to featured work, résumé, and collaboration information.
- `Need a system built` — links to services and the qualified inquiry.

### Proof

Use operational evidence instead of patent, file-count, product-count, or documentation-volume claims.

Initial proof:

- 41 sites operated by the BeyondMythos deployment engine.
- Hourly automated publishing and deployment activity.
- Tested workflow, retry, persistence, and metrics behavior in TaskFlow.
- End-to-end product ownership across TypeScript, Python, React, Next.js, data workflows, and deployment.

Claims must remain conservative. Deployment count is operational proof and must not be presented as customer, revenue, or audience traction.

### Featured work

Show exactly three featured projects in this order:

1. BeyondMythos Autonomous Deployment Engine.
2. Tradewind DealFlow.
3. TaskFlow.

Each card contains:

- project status;
- one-sentence user or system problem;
- role and responsibility;
- stack;
- two or three concrete proof points;
- case-study link;
- live or repository link where safe.

No filter tabs are necessary on the homepage because there are only three featured projects.

### Capabilities

Organize capabilities by problems solved:

- Product engineering — TypeScript, React, Next.js, APIs, product UX.
- Workflow and data systems — intake, validation, provenance, persistence, review queues.
- Automation and AI integration — provider abstraction, retries, scheduled workflows, evaluation.
- Delivery and operations — tests, CI/CD, cloud deployment, documentation, handoff.

Remove patent prosecution and build-to-acquisition positioning.

### Process

Use four steps:

1. Diagnose the workflow and constraint.
2. Design the smallest reliable system.
3. Ship with tests, deployment, and operator documentation.
4. Measure failures, recoveries, and real outcomes.

The process copy should communicate disciplined end-to-end ownership without repeatedly emphasizing that work was performed alone.

### About and conversion

The About section presents Nic as a product-minded engineer in Fall River, Massachusetts. It emphasizes clear technical communication, practical product judgment, and ownership from discovery through deployment.

The final conversion block supports both paths:

- `Discuss a role`
- `Discuss a project`
- `View GitHub`
- `View résumé`

## BeyondMythos case study

Title:

> BeyondMythos Autonomous Deployment Engine

Summary:

> A production system that generates, validates, deploys, and operates independently branded web properties.

The visible BeyondMythos site is described as the live operating surface of the engine, not as the primary asset.

Required sections:

1. The operating problem.
2. Responsibilities and constraints.
3. System lifecycle.
4. Provider abstraction and fallback.
5. Bounded concurrency and failure isolation.
6. Deployment, domain, and configuration management.
7. Commerce, fulfillment, and subscriber persistence.
8. Testing and recovery behavior.
9. Current proof and honest limitations.

Evidence:

- 41 deployed sites.
- 14 mapped domains.
- hourly workflow activity;
- independently deployed site projects;
- multiple generation providers and template fallback;
- parallel processing with bounded concurrency;
- checkout validation and Stripe fulfillment;
- newsletter persistence;
- per-site agent support;
- automated tests around critical behavior.

Limitations:

- do not claim customer adoption without customer evidence;
- do not claim revenue without verified revenue;
- do not present site count as equivalent to product-market fit;
- do not expose private repository details or secrets.

## Tradewind DealFlow presentation

Present Tradewind as a private, reviewable acquisition-operations workflow.

Emphasize:

- authorized data intake;
- source provenance;
- conflict handling;
- review queues;
- compliance boundaries;
- local-first or controlled storage;
- typed implementation and tests;
- operator documentation.

If no safe public demo exists, use a sanitized screenshot and describe the repository as private. Never fabricate a public link.

## TaskFlow presentation

Present TaskFlow as tested workflow infrastructure rather than a generic autonomous-agent claim.

Emphasize:

- typed workflow definitions;
- persistence and retries;
- metrics and failure handling;
- HTTP and contract behavior;
- test coverage of critical paths;
- Docker, cloud deployment, and VPS deployment documentation.

Remove documentation word counts and raw file counts as proof.

## Constellation COO treatment

Remove all of the following:

- patent-pending language;
- patent claim counts;
- sole-inventor labels;
- flagship or main-project labels;
- patent-protection sections;
- patent-focused calls to action;
- acquisition/data-room positioning tied to patent ownership.

If retained, title or describe the route as:

> Experimental agent-scheduling engine

Its proof may include Python, pytest, synthetic benchmark methodology, and measured benchmark results when the limitations are stated explicitly.

It will not appear in the homepage featured-project group or the primary footer.

## Services design

### Product and systems audit

For founders or small product teams with:

- unreliable workflows;
- expensive API usage;
- fragile data flow;
- stalled or difficult-to-operate builds.

Deliverables:

- architecture and workflow review;
- risk and bottleneck findings;
- prioritized implementation plan;
- delivery estimate;
- recorded walkthrough.

### Fixed-scope build sprint

For one narrow:

- internal tool;
- workflow automation;
- data product;
- customer-facing feature.

Deliverables:

- working software in the client's environment;
- tests around critical behavior;
- deployment and operator documentation;
- a short post-launch support window.

The services page must include:

- good-fit criteria;
- not-a-fit criteria;
- a simple delivery process;
- links to relevant case studies;
- a project-inquiry form or email workflow.

Pricing may be expressed as `from` ranges only when the current business terms support them. The page must not imply immediate checkout.

## Inquiry flow

The former Purchase route becomes an inquiry flow asking:

1. What exists today?
2. Who uses it?
3. What is failing or costing time or money?
4. What outcome is needed?
5. What timeline or constraint matters?
6. How should Nic respond?

Submitting the form may open a prefilled email if no server-side form endpoint is configured. The interface must explain this behavior before submission and provide a direct email fallback.

## Résumé route

Create a printable HTML professional snapshot containing only facts supported by the portfolio and repositories:

- Nic Albertson;
- Full-stack / product engineer;
- Fall River, Massachusetts;
- contact and GitHub links;
- concise professional summary;
- selected systems: BeyondMythos, Tradewind DealFlow, and TaskFlow;
- primary technical capabilities;
- selected operational evidence.

Do not invent employment history, education, work authorization, customer names, revenue, or dates that are not already verified. Include a `Print / Save as PDF` control using the browser print dialog.

## Blog and legacy content

- Remove the patent article from the blog index, RSS feed, related-post modules, and sitemap.
- Remove patent references from the constraint-optimized orchestration article.
- Remove “20+ products” and acquisition-first framing from blog metadata and index copy.
- Remove acquisition and licensing links from shared footers.
- Existing unfeatured articles may remain accessible after their metadata, navigation, and footer copy are aligned.
- The patent article file may remain in repository history, but the deployed route must not be discoverable through navigation, feed, sitemap, or internal links.

## Shared navigation and footer

All primary pages use the same labels and destinations.

Footer columns:

- Selected work: BeyondMythos, Tradewind, TaskFlow.
- Work with Nic: Services, résumé, contact.
- Connect: GitHub, email, location.

Footer positioning:

> Product-minded full-stack engineer building reliable workflow, data, and deployment systems.

Remove “built solo,” “revenue-ready assets,” licensing, acquisitions, and Constellation links from the global footer.

## Visual and responsive behavior

Preserve existing:

- color variables;
- typography;
- square-cornered panels;
- fine-line borders;
- restrained reveal animations;
- mono uppercase labels;
- canvas constellation motif.

Improve:

- mobile hero text and artwork separation;
- page-side padding;
- responsive card density;
- line length;
- 44-by-44-pixel minimum mobile navigation target;
- CTA hierarchy;
- visible keyboard focus;
- reduced-motion handling.

No new decorative illustration is required. Existing artwork and interface primitives are sufficient.

## Accessibility

- Preserve the skip link and semantic heading order.
- All interactive controls must have accessible names.
- Navigation toggle state must remain synchronized with `aria-expanded`.
- Focus indicators must be clearly visible.
- Touch targets must be at least 44 by 44 pixels where practical.
- Forms must use explicit labels and an `aria-live` status region.
- Respect `prefers-reduced-motion`.
- Decorative canvas content must remain hidden from assistive technology.

## Metadata and structured data

Homepage title:

> Nic Albertson — Full-Stack / Product Engineer

Homepage description:

> Product-minded full-stack engineer building reliable workflow automation, deployment systems, internal tools, and data products. Open to engineering roles and selected client builds.

Update:

- Open Graph copy;
- Twitter copy;
- Person schema job title and description;
- WebSite schema description;
- sitemap;
- RSS metadata;
- canonical links for new routes.

Remove patent strategy, inventor framing, product-count claims, and acquisition language from structured data.

## Implementation boundaries

In scope:

- homepage;
- shared navigation and footer behavior;
- selected-work index;
- BeyondMythos case study;
- TaskFlow positioning updates;
- Constellation demotion and reframing;
- services;
- inquiry route;
- résumé route;
- blog index/feed discovery cleanup;
- sitemap and metadata;
- responsive and accessibility adjustments;
- verification scripts or commands.

Out of scope:

- GitHub username changes;
- repository transfers;
- archiving or deleting GitHub repositories;
- résumé employment history not supplied by the user;
- server-side CRM or form infrastructure;
- a framework migration;
- live production deployment without a separately verified local build.

## Verification

### Content checks

Search all deployed text sources for prohibited positioning:

- `patent`
- `flagship`
- `sole inventor`
- `20+`
- `revenue-ready`
- primary calls to acquire or license assets

Permitted exception: none for patent language in deployed HTML, XML, JavaScript, or structured data.

### Structural checks

- Homepage has the approved navigation and three featured projects.
- BeyondMythos appears first.
- Constellation is absent from homepage featured work and primary footer.
- Services exposes only the audit and build sprint as primary offers.
- Purchase is absent from global navigation.
- Sitemap includes BeyondMythos and résumé.
- Sitemap excludes the patent article and purchase-first framing.

### Functional checks

- Mobile navigation opens, closes, and updates accessibility state.
- Filter controls work where retained.
- Inquiry form produces a correctly encoded email or configured form request.
- Print résumé control invokes the browser print flow.
- All primary internal links resolve.

### Visual checks

Verify at desktop and mobile viewports:

- hero layout;
- navigation;
- project cards;
- services;
- inquiry form;
- résumé;
- BeyondMythos case study;
- footer.

Compare the rebuilt homepage against the captured production homepage to confirm that the established visual identity remains recognizable while the positioning and hierarchy have changed.

## Rollout

1. Implement on a dedicated local branch.
2. Run content, link, and interaction checks.
3. Review desktop and mobile renders locally.
4. Correct visual and functional regressions.
5. Commit the verified implementation.
6. Push and open a pull request only after local verification.
7. Deploy to production only after the user explicitly approves the verified build.

## Success criteria

The overhaul is complete when:

- a hiring manager can identify Nic's target role and strongest evidence within the first viewport;
- BeyondMythos is understood as an autonomous deployment engine;
- the site has separate, obvious employer and client paths;
- only three projects dominate the homepage;
- patent and COO-flagship positioning is absent;
- services have two clear offers;
- the purchase-first funnel is replaced by qualified inquiry;
- mobile hierarchy and navigation are visibly improved;
- all primary links and interactions work;
- the static site remains easy to deploy and maintain.
