# FullStackAssets

## Agentic Capability Library marketplace

The marketplace implementation is being built on the isolated `codex/agent-library-marketplace-design` branch. The public site remains a static GitHub Pages property; the marketplace Canon adapter is a downstream, read-only projection of the Agentic AI Role Library and must never mutate Canon.

### Unit 1: Canon Registry Adapter

Run the Unit 1 tests with:

```bash
node --test tests/marketplace/canon/*.test.mjs
```

Import an explicit canonical export with:

```bash
node marketplace/bin/import-canon.mjs --source /path/to/export --out data/library
```

The export directory must contain `roles.csv`, `skills.csv`, `integrations.csv`, `overlays.csv`, and `relationships.csv`. Successful imports write deterministic snapshots/checksums plus append-only change events. Validation failures are fail-closed and preserve the last-known-good snapshot.

Design and implementation plans live under `docs/superpowers/specs/` and `docs/superpowers/plans/`.
