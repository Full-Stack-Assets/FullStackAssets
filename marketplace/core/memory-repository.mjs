import { MarketplaceRepository } from './repository.mjs';

function semverParts(value) {
  return String(value).split('.').map((part) => Number.parseInt(part, 10) || 0);
}
function compareSemver(a, b) {
  const pa = semverParts(a.version);
  const pb = semverParts(b.version);
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d;
  }
  return 0;
}
function clone(value) { return structuredClone(value); }

class MemoryRepository extends MarketplaceRepository {
  constructor(state) {
    super();
    this.state = state ?? {
      projectionReceipts: new Map(), products: new Map(), versions: new Map(),
      availability: new Map(), outbox: new Map(),
    };
  }

  async getProjectionReceipt(fingerprint) { return clone(this.state.projectionReceipts.get(fingerprint) ?? null); }
  async putProjectionReceipt(receipt) {
    if (!receipt?.fingerprint) throw new TypeError('projection receipt fingerprint is required');
    if (this.state.projectionReceipts.has(receipt.fingerprint)) throw new Error(`Duplicate projection receipt: ${receipt.fingerprint}`);
    this.state.projectionReceipts.set(receipt.fingerprint, clone(receipt));
    return clone(receipt);
  }
  async listProjectionReceipts() { return [...this.state.projectionReceipts.values()].map(clone); }

  async getProductByCanonicalRef(ref) {
    const product = [...this.state.products.values()].find((item) => item.canonical_refs?.includes(ref));
    return clone(product ?? null);
  }
  async insertProduct(product) {
    if (this.state.products.has(product.id)) throw new Error(`Duplicate product: ${product.id}`);
    this.state.products.set(product.id, clone(product));
    return clone(product);
  }
  async getProduct(id) { return clone(this.state.products.get(id) ?? null); }
  async updateProduct(product) {
    if (!this.state.products.has(product.id)) throw new Error(`Unknown product: ${product.id}`);
    this.state.products.set(product.id, clone(product));
    return clone(product);
  }

  async insertProductVersion(version) {
    if (this.state.versions.has(version.id)) throw new Error(`Duplicate product version: ${version.id}`);
    const duplicate = [...this.state.versions.values()].some((item) => item.product_id === version.product_id && item.version === version.version);
    if (duplicate) throw new Error(`Duplicate product version tuple: ${version.product_id}@${version.version}`);
    this.state.versions.set(version.id, clone(version));
    return clone(version);
  }
  async getProductVersion(id) { return clone(this.state.versions.get(id) ?? null); }
  async listProductVersions(productId) {
    return [...this.state.versions.values()].filter((item) => item.product_id === productId).sort(compareSemver).map(clone);
  }

  async setAvailability(productVersionId, state, reason = null) {
    if (!this.state.versions.has(productVersionId)) throw new Error(`Unknown product version: ${productVersionId}`);
    const record = { product_version_id: productVersionId, availability_state: state, reason_code: reason };
    this.state.availability.set(productVersionId, record);
    return clone(record);
  }
  async getAvailability(productVersionId) { return clone(this.state.availability.get(productVersionId) ?? null); }

  async appendOutbox(event) {
    if (!event?.id) throw new TypeError('outbox event id is required');
    if (this.state.outbox.has(event.id)) throw new Error(`Duplicate outbox event: ${event.id}`);
    this.state.outbox.set(event.id, clone(event));
    return clone(event);
  }
  async listOutbox() { return [...this.state.outbox.values()].map(clone); }

  async transaction(fn) {
    const workingState = {
      projectionReceipts: new Map([...this.state.projectionReceipts].map(([k,v]) => [k, clone(v)])),
      products: new Map([...this.state.products].map(([k,v]) => [k, clone(v)])),
      versions: new Map([...this.state.versions].map(([k,v]) => [k, clone(v)])),
      availability: new Map([...this.state.availability].map(([k,v]) => [k, clone(v)])),
      outbox: new Map([...this.state.outbox].map(([k,v]) => [k, clone(v)])),
    };
    const tx = new MemoryRepository(workingState);
    const result = await fn(tx);
    this.state = workingState;
    return result;
  }
}

export function createMemoryRepository() { return new MemoryRepository(); }
