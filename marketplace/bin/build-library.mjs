#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildSearchIndex } from '../catalog/build-search-index.mjs';
import { buildLibraryTree } from '../catalog/render.mjs';

function arg(name){ const i=process.argv.indexOf(name); return i>=0 ? process.argv[i+1] : null; }
const catalogPath=arg('--catalog');
const outDir=arg('--out') ?? 'library';
if(!catalogPath){ console.error('Usage: node marketplace/bin/build-library.mjs --catalog <catalog.json> --out <dir>'); process.exit(2); }
try {
  const catalog=JSON.parse(readFileSync(resolve(catalogPath),'utf8'));
  const searchIndex=buildSearchIndex(catalog);
  buildLibraryTree({catalog,searchIndex,outDir:resolve(outDir)});
} catch(error){ console.error(error?.stack ?? String(error)); process.exit(1); }
