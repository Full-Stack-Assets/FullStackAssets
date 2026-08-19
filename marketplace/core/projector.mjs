import { createHash } from 'node:crypto';
import { createProduct, createProductVersion } from './records.mjs';

function hashHex(value) { return createHash('sha256').update(String(value)).digest('hex'); }
export function deterministicProductId(canonicalRef) { return `PRD-${hashHex(canonicalRef).slice(0,12).toUpperCase()}`; }
function deterministicVersionId(productId, version, hash) { return `PRDV-${hashHex(`${productId}|${version}|${hash}`).slice(0,12).toUpperCase()}`; }
function normalizeCanonEvent(event = {}) {
  return {
    ...event,
    id: event.id ?? event.event_id ?? null,
    content_hash: event.content_hash ?? event.next_hash ?? null,
    new_version: event.new_version ?? event.next_version ?? null,
  };
}
function projectionFingerprint(event) {
  return hashHex([event.id, event.entity_type, event.entity_id, event.new_version ?? '', event.content_hash ?? ''].join('|'));
}
function outboxId(type, aggregateId, eventId) { return `OB-${hashHex(`${type}|${aggregateId}|${eventId}`).slice(0,16).toUpperCase()}`; }
function slugify(value, fallback) {
  const slug = String(value ?? '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return slug || String(fallback).toLowerCase();
}
function productType(entityType) {
  if (entityType === 'SKILL') return 'SKILL';
  if (entityType === 'ROLE' || entityType === 'AGENT_DEFINITION') return 'AGENT';
  if (entityType === 'WORKFLOW' || entityType === 'FACTORY') return 'WORKFLOW_PACK';
  return 'COLLECTION';
}

export async function projectCanonEvent(repo, rawEvent, canonicalEntity) {
  const event = normalizeCanonEvent(rawEvent);
  if (!event.id || !event.entity_id || !event.entity_type) throw new TypeError('Canonical event identity is required');
  if (canonicalEntity?.id !== event.entity_id || canonicalEntity?.entity_type !== event.entity_type) throw new Error('Canonical event/entity identity mismatch');
  if (!event.content_hash) throw new TypeError('Canonical event content hash is required');
  if (canonicalEntity.content_hash !== event.content_hash) throw new Error('Canonical event/entity content hash mismatch');
  const fingerprint = projectionFingerprint(event);
  if (await repo.getProjectionReceipt(fingerprint)) return { status:'NOOP', product_id:null, product_version_id:null };
  return repo.transaction(async (tx) => {
    if (await tx.getProjectionReceipt(fingerprint)) return { status:'NOOP', product_id:null, product_version_id:null };
    let product = await tx.getProductByCanonicalRef(event.entity_id);
    const isNewProduct = !product;
    if (!product) {
      product = createProduct({id:deterministicProductId(event.entity_id),publisher_id:'PUB-001',type:productType(event.entity_type),slug:slugify(canonicalEntity.name,event.entity_id),canonical_refs:[event.entity_id],visibility:'PRIVATE',commercial_state:'REFERENCE_ONLY'});
      await tx.insertProduct(product);
    }
    const version = event.new_version ?? canonicalEntity.version;
    if (!version) throw new TypeError('Canonical version is required for projection');
    const existing = (await tx.listProductVersions(product.id)).find((item)=>item.version===version);
    if (existing) throw new Error(`CANON_VERSION_COLLISION:${event.entity_id}@${version}`);
    const productVersion = createProductVersion({id:deterministicVersionId(product.id,version,event.content_hash),product_id:product.id,version,canonical_snapshot:{refs:[event.entity_id],hashes:[event.content_hash],canon_versions:[version]},publication_state:'DRAFT',created_from_event:event.id});
    await tx.insertProductVersion(productVersion);
    await tx.putProjectionReceipt({fingerprint,event_id:event.id,entity_type:event.entity_type,entity_id:event.entity_id,canonical_version:version,content_hash:event.content_hash,product_id:product.id,product_version_id:productVersion.id,result_state:isNewProduct?'CREATED':'VERSION_CREATED'});
    if (isNewProduct) await tx.appendOutbox({id:outboxId('PRODUCT_CREATED',product.id,event.id),event_type:'PRODUCT_CREATED',aggregate_type:'PRODUCT',aggregate_id:product.id,payload:{canonical_ref:event.entity_id}});
    await tx.appendOutbox({id:outboxId('PRODUCT_VERSION_CREATED',productVersion.id,event.id),event_type:'PRODUCT_VERSION_CREATED',aggregate_type:'PRODUCT_VERSION',aggregate_id:productVersion.id,payload:{product_id:product.id,canonical_ref:event.entity_id,version}});
    return {status:isNewProduct?'CREATED':'VERSION_CREATED',product_id:product.id,product_version_id:productVersion.id};
  });
}
