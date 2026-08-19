import {
  PRODUCT_TYPES, COMMERCIAL_STATES, VERSION_STATES, COMPATIBILITY_STATES,
  VISIBILITY_STATES, AVAILABILITY_STATES,
} from './constants.mjs';

export { PRODUCT_TYPES, COMMERCIAL_STATES, VERSION_STATES, COMPATIBILITY_STATES, VISIBILITY_STATES, AVAILABILITY_STATES };

function requireString(name, value) {
  if (typeof value !== 'string' || value.trim() === '') throw new TypeError(`${name} is required`);
  return value.trim();
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

export function createProduct(input) {
  const type = requireString('type', input.type).toUpperCase();
  if (!PRODUCT_TYPES.includes(type)) throw new TypeError(`Unsupported product type: ${type}`);
  const visibility = (input.visibility ?? 'PRIVATE').toUpperCase();
  if (!VISIBILITY_STATES.includes(visibility)) throw new TypeError(`Unsupported visibility: ${visibility}`);
  const commercialState = (input.commercial_state ?? 'REFERENCE_ONLY').toUpperCase();
  if (!COMMERCIAL_STATES.includes(commercialState)) throw new TypeError(`Unsupported commercial state: ${commercialState}`);
  if (!Array.isArray(input.canonical_refs) || input.canonical_refs.length === 0) throw new TypeError('canonical_refs must contain at least one canonical reference');

  return deepFreeze({
    id: requireString('id', input.id),
    publisher_id: requireString('publisher_id', input.publisher_id),
    type,
    slug: requireString('slug', input.slug),
    canonical_refs: [...new Set(input.canonical_refs.map((ref) => requireString('canonical ref', ref)))].sort(),
    visibility,
    commercial_state: commercialState,
  });
}

export function createProductVersion(input) {
  const snap = input.canonical_snapshot ?? {};
  const refs = Array.isArray(snap.refs) ? snap.refs : [];
  const hashes = Array.isArray(snap.hashes) ? snap.hashes : [];
  const canonVersions = Array.isArray(snap.canon_versions) ? snap.canon_versions : [];
  if (refs.length === 0) throw new TypeError('canonical snapshot requires at least one canonical ref');
  if (hashes.length === 0) throw new TypeError('canonical snapshot requires at least one canonical hash');
  if (refs.length !== hashes.length || refs.length !== canonVersions.length) {
    throw new TypeError('canonical snapshot refs, hashes, and canon versions must align');
  }
  hashes.forEach((hash) => {
    if (typeof hash !== 'string' || !/^[a-f0-9]{64}$/i.test(hash)) throw new TypeError('canonical hash must be SHA-256 hex');
  });
  const publicationState = (input.publication_state ?? 'DRAFT').toUpperCase();
  if (!VERSION_STATES.includes(publicationState)) throw new TypeError(`Unsupported publication state: ${publicationState}`);

  return deepFreeze({
    id: requireString('id', input.id),
    product_id: requireString('product_id', input.product_id),
    version: requireString('version', input.version),
    canonical_snapshot: {
      refs: [...refs],
      hashes: [...hashes],
      canon_versions: [...canonVersions],
    },
    compatibility: [...(input.compatibility ?? [])],
    dependencies: [...(input.dependencies ?? [])],
    evaluation_record_ids: [...(input.evaluation_record_ids ?? [])],
    changelog: input.changelog ?? '',
    publication_state: publicationState,
    created_from_event: input.created_from_event ?? null,
  });
}
