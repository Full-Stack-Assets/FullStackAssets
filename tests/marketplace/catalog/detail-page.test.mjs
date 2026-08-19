import test from 'node:test';
import assert from 'node:assert/strict';
import { renderEntry } from '../../../marketplace/catalog/render.mjs';

function page(overrides={}){
  return renderEntry({
    id:'ESP-02',type:'AGENT',slug:'esp-02-software-implementation-agent',name:'Software Implementation Agent',
    description:'Produces bounded implementation changes.',boundary:'No protected-branch merge or production deployment.',
    skill_ids:['SKL-013','SKL-026','SKL-028'],commercial_state:'REFERENCE_ONLY',
    compatibility:[{runtime:'CHATGPT',state:'VERIFIED',package_available:true},{runtime:'GEMINI',state:'EXPERIMENTAL',package_available:false}],
    evaluation_summary:{status:'VERIFIED',tests:42,critical_failures:0},versions:['1.0.0','1.1.0'],...overrides,
  });
}

test('detail page exposes capability, boundary, compatibility, trust, and version sections',()=>{
  const html=page();
  for(const label of ['What it does','What it does not do','Included Skills','Compatibility','Trust &amp; Verification','Versions']) assert.match(html,new RegExp(label.replace('&','&amp;')));
  assert.match(html,/SKL-026/);
  assert.match(html,/uses skill/);
  assert.match(html,/CHATGPT/);
  assert.match(html,/VERIFIED/);
});

test('install appears only with a verified packaged runtime distribution',()=>{
  assert.match(page(),/>Install</);
  assert.doesNotMatch(page({compatibility:[{runtime:'CHATGPT',state:'VERIFIED',package_available:false}]}),/>Install</);
});
