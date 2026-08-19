#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { buildLaunchEvidence, assertLaunchEvidenceComplete } from '../launch/evidence.mjs';
const args=process.argv.slice(2);const index=args.indexOf('--fixture');if(index<0||!args[index+1]){console.error('usage: verify-marketplace-launch.mjs --fixture <path>');process.exit(2);}
try{
  const input=JSON.parse(await readFile(args[index+1],'utf8'));
  const bundle=buildLaunchEvidence(input);assertLaunchEvidenceComplete(bundle);
  console.log(JSON.stringify(bundle));
}catch(error){console.error(error.code??error.message);process.exit(1);}
