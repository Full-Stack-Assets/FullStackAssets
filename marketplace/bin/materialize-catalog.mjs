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
    const names=readdirSync(partsDir).filter((name)=>/^\d{3}\.b64$/.test(name)).sort();
    if(!names.length) throw new Error('CATALOG_BASELINE_PARTS_MISSING');
    if(names[0] !== '000.b64') throw new Error('CATALOG_BASELINE_PARTS_INVALID_START');
    for(let i=0;i<names.length;i++){
      const expected=`${String(i).padStart(3,'0')}.b64`;
      if(names[i]!==expected) throw new Error(`CATALOG_BASELINE_PARTS_GAP:${expected}`);
    }
    return names.map((name)=>readFileSync(join(partsDir,name),'utf8').trim()).join('');
  }
  if(!source) throw new Error('CATALOG_BASELINE_SOURCE_REQUIRED');
  return readFileSync(source,'utf8').trim();
}
try{
  const encoded=encodedPayload();
  const compressed=Buffer.from(encoded,'base64');
  const bytes=gunzipSync(compressed);
  const catalog=JSON.parse(bytes.toString('utf8'));
  if(metaPath){
    const meta=JSON.parse(readFileSync(metaPath,'utf8'));
    if(meta.compressed_bytes !== undefined && compressed.length!==meta.compressed_bytes) throw new Error(`CATALOG_BASELINE_COMPRESSED_SIZE_MISMATCH:${compressed.length}`);
    if(meta.uncompressed_bytes !== undefined && bytes.length!==meta.uncompressed_bytes) throw new Error(`CATALOG_BASELINE_UNCOMPRESSED_SIZE_MISMATCH:${bytes.length}`);
    const hash=createHash('sha256').update(bytes).digest('hex');
    if(hash!==meta.uncompressed_sha256) throw new Error(`CATALOG_BASELINE_HASH_MISMATCH:${hash}`);
    if(meta.entry_count !== undefined && catalog.entries?.length!==meta.entry_count) throw new Error(`CATALOG_BASELINE_ENTRY_COUNT_MISMATCH:${catalog.entries?.length ?? 0}`);
  }
  writeFileSync(out,bytes);
}catch(error){console.error(error?.stack ?? String(error));process.exit(1);}
