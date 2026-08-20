import { projectCanonEvent } from '../core/projector.mjs';
import { catalogEntryFromProjection } from './from-projection.mjs';
import { buildPublicCatalog } from './build-catalog.mjs';
import { buildSearchIndex } from './build-search-index.mjs';
import { buildLibraryTree } from './render.mjs';

export async function projectCanonicalVolume({repo,event,canonicalEntity,existingEntries=[],publisher={id:'PUB-001',name:'Full Stack Assets',trust_tier:'FIRST_PARTY'},outDir}){
  const projected=await projectCanonEvent(repo,event,canonicalEntity);
  if(projected.status==='NOOP'){
    const catalog=buildPublicCatalog({entries:existingEntries,publishers:[publisher],generated_at:null});
    return {projected,catalog};
  }
  const product=await repo.getProduct(projected.product_id);
  const versions=await repo.listProductVersions(product.id);
  const entry=catalogEntryFromProjection({canonicalEntity,product,versions,publisher});
  const merged=[...existingEntries.filter((item)=>item.id!==entry.id),entry];
  const catalog=buildPublicCatalog({entries:merged,publishers:[publisher],generated_at:null});
  const searchIndex=buildSearchIndex(catalog);
  if(outDir) buildLibraryTree({catalog,searchIndex,outDir});
  return {projected,entry,catalog,searchIndex};
}
