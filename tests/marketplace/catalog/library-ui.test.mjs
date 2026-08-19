import test from 'node:test';
import assert from 'node:assert/strict';
import { renderLibraryIndex } from '../../../marketplace/catalog/render.mjs';

const catalog={taxonomy:{types:['AGENT','SKILL'],domains:['Engineering']},entries:[
  {id:'ESP-02',type:'AGENT',slug:'esp-02-software-implementation-agent',name:'Software Implementation Agent',domain:'Engineering',description:'Builds bounded code changes',commercial_state:'REFERENCE_ONLY'},
  {id:'SKL-026',type:'SKILL',slug:'skl-026-code-generation-secure-implementation',name:'Code Generation & Secure Implementation',domain:'Engineering',description:'Secure implementation capability',commercial_state:'FREE'},
]};

test('library index renders progressive-enhancement search and shelf hooks',()=>{
  const html=renderLibraryIndex(catalog);
  assert.match(html,/data-library-search/);
  assert.match(html,/data-library-type/);
  assert.match(html,/data-library-domain/);
  assert.match(html,/data-library-grid/);
  assert.match(html,/data-library-result-count/);
  assert.match(html,/Browse the Library/);
  assert.match(html,/Software Implementation Agent/);
  assert.match(html,/Code Generation &amp; Secure Implementation/);
});
