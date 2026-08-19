# Agentic Capability Library Marketplace — Design Review Addendum

**Status:** NORMATIVE COMPANION TO THE 2026-08-19 FROZEN DESIGN  
**Applies to:** `2026-08-19-agentic-capability-library-marketplace-design.md`

This addendum records the required self-review corrections discovered after the approved design was committed. Where wording differs, this addendum controls.

## 1. Public reference inventory is separate from commercial publication

The Library must be able to project the full approved canonical Role/Skill inventory for browsing without commercializing every item.

Add the following marketplace commercial states:

```text
DRAFT
REFERENCE_ONLY
FREE
PAID
PILOT
COMING_SOON
ENTERPRISE_ONLY
SUSPENDED
RETIRED
```

`REFERENCE_ONLY` means approved public metadata may appear in the Library, but there is no installable paid artifact, no purchase entitlement, and no implied runtime or organizational authority.

This removes any ambiguity between:

- exposing the canonical catalog for discovery, and
- publishing an installable/commercial ProductVersion.

High-risk or immature canonical entries may therefore remain publicly referenceable while still being gated from commercial distribution.

## 2. Reference-only projection gate

A canonical item may enter the public reference catalog only after:

- schema validation
- stable-ID validation
- provenance validation
- public-metadata classification
- exclusion of private, restricted, security-sensitive, or publisher-only fields

Commercial publication gates remain unchanged. Paid releases, major versions, Moderate/High/Restricted risk, I3/I4 authority changes, new sensitive data classes, policy exceptions, uncertain rights, and new third-party publishers require Human Authority.

## 3. Canon event entity coverage

The canonical event envelope must support all marketplace-relevant canonical entity classes:

```text
CAPABILITY
SKILL
ROLE
AGENT_DEFINITION
WORKFLOW
FACTORY
INTEGRATION
OVERLAY
POLICY
RUNTIME_ADAPTER
```

`EvidenceReceipt` remains the evidence reference attached to events rather than a commercial product class.

## 4. Enum casing

Machine-readable lifecycle and status enums are uppercase canonical constants. Examples:

```text
DRAFT
VALIDATING
EVALUATING
COMMERCIAL_READY
PUBLICATION_REVIEW
PUBLISHED
SUPERSEDED
RETIRED

VERIFIED
EXPERIMENTAL
UNAVAILABLE
BLOCKED
DEPRECATED

ACTIVE
SUSPENDED
EXPIRED
REVOKED
```

Human-facing UI labels may use title case, but persistence/API contracts use the uppercase values.

## 5. MVP acceptance addition

Add a required acceptance test before the automatic-new-volume test:

### Full reference projection

Ingest the approved canonical inventory and verify that every eligible canonical Role/Skill receives exactly one stable Library identity without manually authoring per-item storefront records.

The test must prove:

- no duplicate stable IDs
- reference-only and commercial states are distinct
- private/restricted fields are excluded from public snapshots
- commercial offers exist only for explicitly commercialized products
- search can find reference-only and commercial entries according to public visibility

## 6. Frozen constitutional rule

The final governing contract remains:

> **Canon defines capabilities. Marketplace packages and commercializes them. Runtime adapters distribute them. Customers receive entitlements to immutable versions. Evidence determines trust. Human Authority governs consequential actions.**

The public reference catalog is a projection of Canon, not a second source of truth.