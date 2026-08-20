import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read=(path)=>readFileSync(new URL(`../../../${path}`,import.meta.url),'utf8');

test('enterprise routes exist, preserve contact navigation, and embed no private inventory',()=>{
  for(const path of ['enterprise/index.html','enterprise/registry/index.html','enterprise/publishers/index.html']){
    const html=read(path);assert.match(html,/href="\/#contact" class="nav-cta">Contact<\/a>/);assert.doesNotMatch(html,/ENT-|private_product_id|organization_secret/i);
  }
});

test('registry client keeps private data API-derived and handles denied state',()=>{
  const js=read('assets/enterprise-registry.js');assert.match(js,/\/v1\/enterprise\/registries\//);assert.match(js,/Registry access denied/);assert.match(js,/Unable to refresh private registry/);
});
