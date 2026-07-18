# TaskFlow Threat Model

## Scope

This model covers the implemented local runtime and the likely risks introduced by future Studio, model, and connector integrations. The included demo uses synthetic data and no external tools.

## Assets

- Workflow inputs and resulting business data
- Run history and verification evidence
- Connector and model credentials in future adapters
- Approval decisions
- Tenant boundaries in a future hosted service
- Integrity of plans, outputs, metrics, and audit logs

## Trust boundaries

1. Untrusted caller to HTTP handler
2. HTTP handler to workflow runtime
3. Runtime to workflow implementation
4. Runtime to persistence
5. Future runtime adapters to third-party models and connectors
6. Future Studio user to tenant-scoped API

## Threats and controls

| Threat | Current control | Production requirement |
|---|---|---|
| Malformed or oversized input | Planning validation and 1 MB HTTP body limit | Schema validation, rate limits, quotas, WAF |
| Path traversal through run ID | Safe run-ID character allowlist | Continue allowlist; avoid user-selected storage paths |
| Partial/corrupt run writes | Temporary file plus atomic rename | Managed durable database with transactions and backups |
| Prompt injection in future model steps | No model adapter is included | Treat model output as untrusted; tool policies and allowlists |
| SSRF through future connectors | No outbound connector is included | Destination allowlists, egress proxy, URL validation |
| Secret leakage in logs | Demo has no secrets; usage is explicit | Redaction pipeline, secret manager, log review tests |
| PII over-retention | Synthetic fixtures only | Retention windows, deletion API, encryption, access logs |
| Cross-tenant data access | No multi-tenancy is claimed | Tenant-scoped authorization at every read/write boundary |
| Unauthorized approvals | No approval UI is included | Signed identity, role checks, immutable approval events |
| Denial of service through retries | Per-step maximum attempts | Per-run timeouts, concurrency caps, circuit breakers |
| Cost runaway | Cost recorded only when adapters report it | Hard per-run budgets and provider-side spending caps |
| Log tampering | Ordered JSON events | Append-only managed audit store and integrity hashes |
| Dependency compromise | Zero production packages; locked dev dependencies | Dependabot/Renovate, provenance checks, periodic audit |
| Benchmark misrepresentation | Limitations embedded in report | Separate production telemetry from synthetic benchmarks |

## Known unresolved production controls

The reference implementation does not provide authentication, authorization, tenant isolation, encryption key management, managed backups, distributed locking, queueing, connector credential storage, production observability, or legal/compliance controls. A hosted TaskFlow Studio must add and test these before accepting real customer data.
