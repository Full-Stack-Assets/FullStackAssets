# Unit 7 — Runtime Distribution, Compatibility & Evaluation Factory

**Goal:** Turn every eligible immutable ProductVersion into a provider-neutral universal package plus independently evaluated runtime distributions for ChatGPT, Cursor, Gemini, Grok, Manus, MCP/API, without allowing adapters to redefine Canon authority.

## Invariants
- Canonical package is upstream of every runtime adapter.
- Runtime adapters translate packaging/tool syntax only; they cannot add permissions, integrations, data classes, or authority.
- Compatibility is evidence-derived per ProductVersion + runtime + adapter version.
- A failure in one runtime does not falsify or block other runtime distributions unless that runtime is explicitly required by the product.
- VERIFIED requires a passing runtime-specific evaluation receipt; marketing metadata cannot self-assert verification.
- Unsupported runtimes are UNAVAILABLE, never fabricated.
- Distribution artifacts remain content-addressed and immutable.

## Tasks
1. Define stable runtime adapter contracts and capability declarations.
2. Add runtime distribution persistence and immutable compatibility receipts.
3. Implement deterministic runtime package plans from universal manifests.
4. Implement compatibility evaluator and evidence-derived state matrix.
5. Add distribution service/API read surfaces without customer entitlement leakage.
6. Add runtime-specific adverse/evaluation fixtures.
7. Add end-to-end acceptance proving independent runtime success/failure and no authority escalation.
8. Add full inherited CI workflow and verify all Unit 1–7 suites.
