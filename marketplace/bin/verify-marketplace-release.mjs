#!/usr/bin/env node
import{readFileSync}from'node:fs';import{verifyRelease}from'../release/gates.mjs';const i=process.argv.indexOf('--fixture');try{const r=verifyRelease(JSON.parse(readFileSync(process.argv[i+1],'utf8')));console.log(JSON.stringify(r));if(r.status!=='PASS')process.exit(1);}catch(e){console.error(e.message);process.exit(1)}
