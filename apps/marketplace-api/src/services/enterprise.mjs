import { assertRegistryAccess, projectPrivateRegistry } from '../../../../marketplace/enterprise/private-registry.mjs';
import { applyEnterprisePolicy, assertPolicyDoesNotExpand } from '../../../../marketplace/enterprise/policy.mjs';

function forbidden(){const e=new Error('FORBIDDEN');e.code='FORBIDDEN';e.status=403;throw e;}
function membership(context,organizationId){return (context?.memberships??[]).find((m)=>m.organization_id===organizationId&&m.status==='ACTIVE');}
export function createEnterpriseService({repo}={}){
  if(!repo)throw new TypeError('ENTERPRISE_REPOSITORY_REQUIRED');
  return {
    async registry(context,registryId){
      const registry=await repo.getRegistry(registryId);if(!registry)return null;
      assertRegistryAccess(context,registry);
      const entries=await repo.listRegistryProducts(registryId);
      const products=new Map();for(const entry of entries){if(!products.has(entry.product_id))products.set(entry.product_id,await repo.getProduct(entry.product_id));}
      return {registry:{id:registry.id,organization_id:registry.organization_id,name:registry.name,status:registry.status},entries:projectPrivateRegistry({context,registry,entries,productsById:products})};
    },
    async policy(context,organizationId){
      if(!membership(context,organizationId))forbidden();
      const canonical=await repo.getCanonicalOrganizationPolicy(organizationId);
      const overlay=await repo.getEnterprisePolicyOverlay(organizationId)??{};
      const effective=applyEnterprisePolicy({canonical,overlay});assertPolicyDoesNotExpand({canonical,effective});
      return {organization_id:organizationId,effective};
    },
  };
}
