import test from 'node:test';
import assert from 'node:assert/strict';
import { createRouter } from '../../../apps/marketplace-api/src/router.mjs';

test('GET /health returns service health', async()=>{
  const router=createRouter({services:{}});
  const response=await router(new Request('http://local/health'));
  assert.equal(response.status,200);
  assert.deepEqual(await response.json(),{status:'ok'});
});

test('GET /v1/me requires authentication by default', async()=>{
  const router=createRouter({services:{auth:{authenticate:async()=>null}}});
  const response=await router(new Request('http://local/v1/me'));
  assert.equal(response.status,401);
});
