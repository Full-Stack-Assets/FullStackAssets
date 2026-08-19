import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSearchIndex, searchIndex } from '../../../marketplace/catalog/build-search-index.mjs';

const catalog = { entries:[
  {id:'ESP-03',type:'AGENT',name:'Code Review & Quality Agent',domain:'Engineering',commercial_state:'REFERENCE_ONLY',description:'Reviews pull requests and code quality',use_cases:['PR review'],capabilities:['code review'],publisher_id:'PUB-001',compatibility:['CHATGPT']},
  {id:'SKL-027',type:'SKILL',name:'Code Review & Static-Analysis Interpretation',domain:'Engineering',commercial_state:'FREE',description:'Reviews code changes',use_cases:['pull request review'],capabilities:['static analysis'],publisher_id:'PUB-001',compatibility:['CHATGPT']},
  {id:'RCP-01',type:'AGENT',name:'Market & Segment Intelligence Agent',domain:'Revenue',commercial_state:'REFERENCE_ONLY',description:'Competitor and market research',use_cases:['competitor research'],capabilities:['market intelligence'],publisher_id:'PUB-001',compatibility:['GEMINI']},
  {id:'GKE-06',type:'AGENT',name:'Research & Source Verification Agent',domain:'Knowledge',commercial_state:'REFERENCE_ONLY',description:'Source-grounded research',use_cases:['competitive research'],capabilities:['source verification'],publisher_id:'PUB-001',compatibility:['CHATGPT']},
]};
const index = buildSearchIndex(catalog);

test('intent query review my PR prioritizes review agent and skill', () => {
  assert.deepEqual(searchIndex(index,'review my PR').slice(0,2).map(x=>x.id), ['ESP-03','SKL-027']);
});

test('research competitors prioritizes market/research entries', () => {
  const ids = searchIndex(index,'research competitors').slice(0,2).map(x=>x.id);
  assert.ok(ids.includes('RCP-01'));
  assert.ok(ids.includes('GKE-06'));
});

test('filters compose with query search', () => {
  assert.deepEqual(searchIndex(index,'review',{type:'SKILL',runtime:'CHATGPT'}).map(x=>x.id), ['SKL-027']);
  assert.deepEqual(searchIndex(index,'research',{publisher:'PUB-001',runtime:'GEMINI'}).map(x=>x.id), ['RCP-01']);
});
