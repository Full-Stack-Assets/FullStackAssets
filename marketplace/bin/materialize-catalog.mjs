#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
function arg(name){const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:null;}
const source=resolve(arg('--source') ?? 'data/library/catalog.snapshot.json.gz.b64');
const out=resolve(arg('--out') ?? 'data/library/catalog.snapshot.json');
const metaPath=arg('--meta') ? resolve(arg('--meta')) : null;
try{
  const encoded=readFileSync(source,'utf8').trim();
  const bytes=gunzipSync(Buffer.from(encoded,'base64'));
  if(metaPath){
    const meta=JSON.parse(readFileSync(metaPath,'utf8'));
    const hash=createHash('sha256').update(bytes).digest('hex');
    if(hash!==meta.uncompressed_sha256) throw new Error(`CATALOG_BASELINE_HASH_MISMATCH:${hash}`);
  }
  JSON.parse(bytes.toString('utf8'));
  writeFileSync(out,bytes);
}catch(error){console.error(error?.stack ?? String(error));process.exit(1);}
