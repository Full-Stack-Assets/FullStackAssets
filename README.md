# FullStackAssets

## Agentic Capability Library marketplace

The marketplace implementation is built as a stacked branch series. The public site remains a static GitHub Pages property; marketplace code is a downstream projection of the Agentic AI Role Library and must never mutate Canon.

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

### Unit 2: Marketplace Core

Run Unit 2 domain tests with:

```bash
node --test tests/marketplace/core/*.test.mjs
```

Unit 2 projects Canon events into private `REFERENCE_ONLY` Products and immutable draft ProductVersions. It defines the marketplace relational schema, transactional repository contract, projection receipts/outbox events, semantic change severity, publication state machine, Human Authority publication policy, and allowlist-based public reference projection.

Run the stacked Unit 1 + Unit 2 verification with:

```bash
node --test tests/marketplace/canon/*.test.mjs tests/marketplace/core/*.test.mjs
```

### Unit 3: Public Library

The public Library is generated from a derived, hash-verified marketplace catalog mirror. The checked-in baseline contains the eligible Canon reference inventory as `REFERENCE_ONLY`; it is not an editable source of truth and does not make items installable or purchasable.

Run Unit 3 tests with:

```bash
node --test tests/marketplace/catalog/*.test.mjs
```

Materialize the derived catalog baseline and build the static Library with:

```bash
node marketplace/bin/materialize-catalog.mjs \
  --parts data/library/catalog-baseline \
  --meta data/library/catalog-baseline.json \
  --out data/library/catalog.snapshot.json
node marketplace/bin/build-library.mjs \
  --catalog data/library/catalog.snapshot.json \
  --out library
```

The baseline is split into ordered `.b64` chunks for reliable transport; `catalog-baseline.json` contains the authoritative projection receipt used to verify compressed size, uncompressed SHA-256, uncompressed bytes, and entry count before rendering.

The Pages workflow also injects the `/library/` discovery link and sitemap root into the deployment workspace, then re-runs static-site verification before Jekyll packages the site. The source portfolio remains person-first and its three featured projects remain unchanged.

Run the full stacked verification with:

```bash
node --test tests/*.test.mjs tests/marketplace/canon/*.test.mjs tests/marketplace/core/*.test.mjs tests/marketplace/catalog/*.test.mjs
```

Design and implementation plans live under `docs/superpowers/specs/` and `docs/superpowers/plans/`.
