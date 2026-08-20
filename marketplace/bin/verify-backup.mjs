#!/usr/bin/env node
import{readFileSync}from'node:fs';import{verifyBackupManifest}from'../operations/backup-manifest.mjs';try{console.log(JSON.stringify(verifyBackupManifest(JSON.parse(readFileSync(process.argv[2],'utf8')))));}catch(e){console.error(e.message);process.exit(1)}
