#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { injectLibraryDiscovery } from '../catalog/site-integration.mjs';
function arg(name){const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:null;}
const file=resolve(arg('--file') ?? 'index.html');
try{ const source=readFileSync(file,'utf8'); writeFileSync(file,injectLibraryDiscovery(source)); }
catch(error){ console.error(error?.stack ?? String(error)); process.exit(1); }
