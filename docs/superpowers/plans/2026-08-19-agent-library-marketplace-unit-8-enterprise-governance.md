# Unit 8 — Enterprise Private Registry, Curated Publisher Governance & Final Launch Evidence

**Goal:** Add organization-private registries, policy overlays, curated publisher verification, revenue-share policy contracts, and a final launch-evidence bundle without weakening Canon authority, runtime isolation, entitlement rules, or Human Authority publication gates.

## Invariants
- Enterprise registries reference canonical/marketplace ProductVersions; they do not fork Canon.
- Organization policy may narrow allowed runtimes, permissions, versions, publishers, or product visibility; it may never expand canonical authority.
- Private products and collections are visible only to entitled organization members.
- Third-party publisher activation requires verified identity/provenance/policy acceptance and Human Authority.
- Revenue-share policy is configuration only; Unit 8 does not execute autonomous payouts.
- FIRST_PARTY remains explicit, not inferred from publisher name.
- Final launch evidence aggregates existing release gates and unit verification receipts; it cannot fabricate missing evidence or convert UNKNOWN to PASS.

## Tasks
1. Add enterprise registry and publisher-verification persistence.
2. Implement effective enterprise policy overlays with monotonic restriction semantics.
3. Implement private-registry projection and organization isolation.
4. Implement curated publisher verification/trust transition rules.
5. Implement configurable revenue-share policy validation with no payout execution.
6. Add enterprise API and static private-registry shell.
7. Implement final launch evidence bundle and launch decision verifier.
8. Add acceptance matrix covering private isolation, publisher gating, policy restriction, and final launch evidence.
9. Add Unit 8 CI running the complete Unit 1–8 suite.
