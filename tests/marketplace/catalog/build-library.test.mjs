import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { buildSearchIndex } from '../../../marketplace/catalog/build-search-index.mjs';
import { buildLibraryTree } from '../../../marketplace/catalog/render.mjs';

function manifest(root){
  const rows=[];
  const walk=(dir)=>{for(const name of readdirSync(dir).sort()){const p=join(dir,name);if(statSync(p).isDirectory()) walk(p); else rows.push([relative(root,p),readFileSync(p,'utf8')]);}};
  walk(root); return rows;
}
const catalog={generated_at:null,taxonomy:{types:['SKILL'],domains:['Reusable Skills']},entries:[{id:'SKL-026',type:'SKILL',slug:'skl-026-code-generation-secure-implementation',name:'Code Generation & Secure Implementation',description:'Creates maintainable code',domain:'Reusable Skills',commercial_state:'REFERENCE_ONLY'}]};

test('identical input generates byte-identical library trees',()=>{
  const root=mkdtempSync(join(tmpdir(),'library-build-'));
  const out=join(root,'library'); const index=buildSearchIndex(catalog);
  buildLibraryTree({catalog,searchIndex:index,outDir:out}); const first=manifest(out);
  buildLibraryTree({catalog,searchIndex:index,outDir:out}); const second=manifest(out);
  assert.deepEqual(second,first);
  rmSync(root,{recursive:true,force:true});
});

test('failed generation preserves the last-known-good library tree',()=>{
  const root=mkdtempSync(join(tmpdir(),'library-lkg-')); const out=join(root,'library'); mkdirSync(out,{recursive:true});
  writeFileSync(join(out,'sentinel.txt'),'known-good');
  assert.throws(()=>buildLibraryTree({catalog:{entries:[{id:'BAD',type:'UNKNOWN',slug:'bad',name:'Bad'}],taxonomy:{}},searchIndex:{entries:[]},outDir:out}),/Unsupported public entry type/);
  assert.equal(readFileSync(join(out,'sentinel.txt'),'utf8'),'known-good');
  rmSync(root,{recursive:true,force:true});
});
