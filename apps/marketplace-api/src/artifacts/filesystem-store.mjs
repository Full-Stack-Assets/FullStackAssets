import { createHash, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { ArtifactStore } from './store.mjs';
function clone(value){return value?structuredClone(value):null;}
export class FilesystemArtifactStore extends ArtifactStore {
  constructor({root,artifacts={}}={}){super();if(!root)throw new TypeError('artifact root is required');this.root=resolve(root);this.artifacts=artifacts;}
  async getMetadata(id){return clone(this.artifacts[id] ?? null);}
  #path(metadata){const path=resolve(this.root,metadata.path);if(path!==this.root&&!path.startsWith(this.root+sep))throw new Error('ARTIFACT_PATH_ESCAPE');return path;}
  async createReadGrant(id,{subject,expiresInSeconds=60}={}){
    if(!subject?.id)throw new TypeError('grant subject is required');
    const metadata=this.artifacts[id];if(!metadata)throw new Error('ARTIFACT_NOT_FOUND');
    const path=this.#path(metadata);const bytes=await readFile(path);const actual=createHash('sha256').update(bytes).digest('hex');
    if(actual!==metadata.sha256)throw new Error(`ARTIFACT_HASH_MISMATCH:${id}`);
    return {type:'FILESYSTEM',grant_id:randomUUID(),artifact_id:id,path,subject:structuredClone(subject),expires_at:new Date(Date.now()+Math.max(1,Number(expiresInSeconds))*1000).toISOString()};
  }
}
