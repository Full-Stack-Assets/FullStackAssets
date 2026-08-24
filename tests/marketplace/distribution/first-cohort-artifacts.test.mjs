import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,existsSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const modulePath='marketplace/launch/artifacts.mjs';

test('first cohort artifact builder emits 70 deterministic ZIP packages with required files',async()=>{
  assert.equal(existsSync(modulePath),true,'artifact builder must exist');
  if(!existsSync(modulePath))return;
  const {buildFirstCohortArtifacts}=await import('../../../marketplace/launch/artifacts.mjs');
  const {readStoreZip}=await import('../../../marketplace/distribution/store-zip.mjs');
  const one=mkdtempSync(join(tmpdir(),'first10-a-'));const two=mkdtempSync(join(tmpdir(),'first10-b-'));
  try{
    const a=buildFirstCohortArtifacts({outDir:one});
    const b=buildFirstCohortArtifacts({outDir:two});
    assert.equal(a.length,70);assert.equal(b.length,70);
    for(let i=0;i<a.length;i++){
      assert.equal(a[i].sha256,b[i].sha256);
      assert.match(a[i].sha256,/^[a-f0-9]{64}$/);
      assert.ok(a[i].path.endsWith('.zip'));
      const bytes=readFileSync(a[i].path);assert.equal(bytes.subarray(0,4).toString('hex'),'504b0304');
      const entries=readStoreZip(bytes);
      for(const required of a[i].required_files){
        if(required.endsWith('/'))assert.ok([...entries.keys()].some(name=>name.startsWith(required)),`${a[i].runtime} requires ${required}`);
        else assert.ok(entries.has(required),`${a[i].runtime} requires ${required}`);
      }
      const manifest=JSON.parse(entries.get('manifest.json').toString('utf8'));
      assert.equal(manifest.product_id,a[i].product_id);
      assert.equal(manifest.product_version_id,a[i].product_version_id);
      assert.equal(manifest.runtime,a[i].runtime);
      assert.deepEqual(manifest.permissions,[]);
    }
  } finally {rmSync(one,{recursive:true,force:true});rmSync(two,{recursive:true,force:true});}
});

test('runtime-specific artifacts contain bounded instructions rather than hidden integrations',async()=>{
  assert.equal(existsSync(modulePath),true,'artifact builder must exist');
  if(!existsSync(modulePath))return;
  const {buildFirstCohortArtifacts}=await import('../../../marketplace/launch/artifacts.mjs');
  const {readStoreZip}=await import('../../../marketplace/distribution/store-zip.mjs');
  const dir=mkdtempSync(join(tmpdir(),'first10-c-'));
  try{
    const artifacts=buildFirstCohortArtifacts({outDir:dir});
    for(const artifact of artifacts){
      const entries=readStoreZip(readFileSync(artifact.path));
      const text=[...entries.values()].map(v=>v.toString('utf8')).join('\n');
      assert.match(text,/I0|supplied input/i);
      assert.doesNotMatch(text,/service[_-]?role|secret key|admin token/i);
    }
  } finally {rmSync(dir,{recursive:true,force:true});}
});
