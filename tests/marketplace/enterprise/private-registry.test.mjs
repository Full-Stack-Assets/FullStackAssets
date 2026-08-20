import test from 'node:test';
import assert from 'node:assert/strict';
import { assertRegistryAccess, projectPrivateRegistry, assertNoCanonicalFork } from '../../../marketplace/enterprise/private-registry.mjs';

const registry={id:'REG-1',organization_id:'ORG-A',name:'Private',status:'ACTIVE'};
const member={memberships:[{organization_id:'ORG-A',status:'ACTIVE',app_role:'ORG_MEMBER'}]};
const admin={memberships:[{organization_id:'ORG-A',status:'ACTIVE',app_role:'ORG_ADMIN'}]};

test('organization member sees org entries but not admin-only entries',()=>{
  const entries=[
    {id:'E1',registry_id:'REG-1',product_id:'P1',visibility:'ORG_ONLY',version_policy:'MAJOR_PINNED'},
    {id:'E2',registry_id:'REG-1',product_id:'P2',visibility:'ORG_ADMIN_ONLY',version_policy:'EXACT'},
  ];
  const products=new Map([['P1',{id:'P1'}],['P2',{id:'P2'}]]);
  assert.equal(projectPrivateRegistry({context:member,registry,entries,productsById:products}).length,1);
  assert.equal(projectPrivateRegistry({context:admin,registry,entries,productsById:products}).length,2);
});

test('cross-organization access fails closed',()=>assert.throws(()=>assertRegistryAccess({memberships:[{organization_id:'ORG-B',status:'ACTIVE',app_role:'ORG_ADMIN'}]},registry),/FORBIDDEN/));

test('private registry may reference product/version but may not fork Canon',()=>{
  assert.equal(assertNoCanonicalFork({product_id:'P1',product_version_id:'PV1'}),true);
  assert.throws(()=>assertNoCanonicalFork({product_id:'P1',canonical_patch:{mission:'changed'}}),/PRIVATE_REGISTRY_CANON_FORK_FORBIDDEN/);
});
