import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';

function baselineNames(dir='data/library/catalog-baseline') {
  return readdirSync(dir).filter((name)=>/^\d{3}\.b64$/.test(name)).sort();
}
function readBaselineParts(dir='data/library/catalog-baseline') {
  const names=baselineNames(dir);
  assert.deepEqual(names,names.map((_,i)=>`${String(i).padStart(3,'0')}.b64`));
  return names.map((name)=>readFileSync(join(dir,name),'utf8').trim()).join('');
}

test('derived public catalog baseline matches its receipt and contains only reference entries',()=>{
  const meta=JSON.parse(readFileSync('data/library/catalog-baseline.json','utf8'));
  const names=baselineNames();
  assert.equal(names.length,8);
  const encoded=readBaselineParts();
  const compressed=Buffer.from(encoded,'base64');
  assert.equal(compressed.length,meta.compressed_bytes);
  const bytes=gunzipSync(compressed);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),meta.uncompressed_sha256);
  assert.equal(bytes.length,meta.uncompressed_bytes);
  const catalog=JSON.parse(bytes.toString('utf8'));
  assert.equal(catalog.entries.length,meta.entry_count);
  assert.equal(new Set(catalog.entries.map((entry)=>entry.id)).size,catalog.entries.length);
  assert.ok(catalog.entries.every((entry)=>entry.commercial_state==='REFERENCE_ONLY'));
  assert.ok(catalog.entries.every((entry)=>entry.commerce===null));
});
