#!/usr/bin/env node
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';
function arg(name){const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:null;}
const sourceArg=arg('--source');
const partsArg=arg('--parts');
const source=sourceArg ? resolve(sourceArg) : null;
const partsDir=partsArg ? resolve(partsArg) : null;
const out=resolve(arg('--out') ?? 'data/library/catalog.snapshot.json');
const metaPath=arg('--meta') ? resolve(arg('--meta')) : null;
function encodedPayload(){
  if(source && partsDir) throw new Error('Use exactly one of --source or --parts');
  if(partsDir){
    const names=readdirSync(partsDir).filter((name)=>name.endsWith('.b64')).sort();
    if(!names.length) throw new Error('CATALOG_BASELINE_PARTS_MISSING');
    return names.map((name)=>readFileSync(join(partsDir,name),'utf8').trim()).join('');
  }
  return readFileSync(source ?? resolve('data/library/catalog.snapshot.json.gz.b64'),'utf8').trim();
}
try{
  const encoded=encodedPayload();
  const bytes=gunzipSync(Buffer.from(encoded,'base64'));
  if(metaPath){
    const meta=JSON.parse(readFileSync(metaPath,'utf8'));
    const hash=createHash('sha256').update(bytes).digest('hex');
    if(hash!==meta.uncompressed_sha256) throw new Error(`CATALOG_BASELINE_HASH_MISMATCH:${hash}`);
  }
  JSON.parse(bytes.toString('utf8'));
  writeFileSync(out,bytes);
}catch(error){console.error(error?.stack ?? String(error));process.exit(1);}
