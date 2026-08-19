import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildSnapshot } from '../../../marketplace/canon/snapshot.mjs';
import { diffSnapshots } from '../../../marketplace/canon/events.mjs';
import { createMemoryRepository } from '../../../marketplace/core/memory-repository.mjs';
import { projectCanonicalVolume } from '../../../marketplace/catalog/automatic-volume.mjs';

function exportWithSkill(purpose='Inspects repository history and structure.'){
  return {
    roles:[], integrations:[], overlays:[], relationships:[],
    skills:[{skill_id:'SKL-046',name:'Repository Archaeology',slug:'skl-046-repository-archaeology',purpose,common_roles:'Engineering',minimum_test_fixture:'Repository with history',status:'APPROVED',path:'reusable_skills/skl-046/SKILL.md'}],
  };
}

test('a Canon-created Skill becomes a rendered Library volume without a marketplace page fixture', async()=>{
  const next=buildSnapshot(exportWithSkill());
  const [event]=diffSnapshots({},next);
  const entity=next.skills[0];
  const repo=createMemoryRepository();
  const root=mkdtempSync(join(tmpdir(),'auto-volume-'));
  const out=join(root,'library');
  const result=await projectCanonicalVolume({repo,event,canonicalEntity:{...entity,version:'1.0.0'},outDir:out});
  assert.equal(result.projected.status,'CREATED');
  assert.equal(existsSync(join(out,'skills','skl-046-repository-archaeology','index.html')),true);
  assert.equal(result.entry.commercial_state,'REFERENCE_ONLY');
  rmSync(root,{recursive:true,force:true});
});
