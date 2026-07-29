# Dependency Inventory

Inventory source: `package-lock.json` generated on July 18, 2026.

## Production runtime

**Direct production dependencies: none.**

The implemented runtime uses Node.js 22 built-ins for HTTP, files, cryptography, performance timing, testing primitives, and Web `Request`/`Response` APIs.

## Development dependencies

| Package | Locked version | License | Purpose |
|---|---:|---|---|
| `typescript` | 5.9.3 | Apache-2.0 | Type checking and compilation |
| `@types/node` | 22.8.7 | MIT | Node.js type declarations |
| `undici-types` | 6.19.8 | MIT | Transitive type dependency of `@types/node` |

## External services

The reference workflow calls no model provider, database, payment system, or third-party connector. Future adapters must be added to this inventory with version, license, data flow, credential scope, and cost behavior.
