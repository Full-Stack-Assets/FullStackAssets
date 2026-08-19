import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSnapshot } from '../../../marketplace/canon/snapshot.mjs';
import { diffSnapshots } from '../../../marketplace/canon/events.mjs';
import { createMemoryRepository } from '../../../marketplace/core/memory-repository.mjs';
import { projectCanonEvent } from '../../../marketplace/core/projector.mjs';

test('Unit 2 consumes the actual Unit 1 Canon event envelope', async()=>{
  const next=buildSnapshot({roles:[],integrations:[],overlays:[],relationships:[],skills:[{
    skill_id:'SKL-046',name:'Repository Archaeology',slug:'skl-046-repository-archaeology',purpose:'Inspects repository history.',common_roles:'Engineering',minimum_test_fixture:'Repository history',status:'APPROVED',path:'reusable_skills/skl-046/SKILL.md'
  }]});
  const [event]=diffSnapshots({},next);
  const entity={...next.skills[0],version:'1.0.0'};
  const repo=createMemoryRepository();
  const result=await projectCanonEvent(repo,event,entity);
  assert.equal(result.status,'CREATED');
  const product=await repo.getProductByCanonicalRef('SKL-046');
  assert.ok(product);
  const versions=await repo.listProductVersions(product.id);
  assert.equal(versions[0].canonical_snapshot.hashes[0],entity.content_hash);
});
