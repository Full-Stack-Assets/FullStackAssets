import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';

test('derived public catalog baseline matches its receipt and contains only reference entries',()=>{
  const meta=JSON.parse(readFileSync('data/library/catalog-baseline.json','utf8'));
  const encoded=readFileSync('data/library/catalog.snapshot.json.gz.b64','utf8').trim();
  const bytes=gunzipSync(Buffer.from(encoded,'base64'));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),meta.uncompressed_sha256);
  assert.equal(bytes.length,meta.uncompressed_bytes);
  const catalog=JSON.parse(bytes.toString('utf8'));
  assert.equal(catalog.entries.length,meta.entry_count);
  assert.equal(new Set(catalog.entries.map((entry)=>entry.id)).size,catalog.entries.length);
  assert.ok(catalog.entries.every((entry)=>entry.commercial_state==='REFERENCE_ONLY'));
  assert.ok(catalog.entries.every((entry)=>entry.commerce===null));
});
