import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync,existsSync } from 'node:fs';
const routes=['my-library/index.html','my-library/owned/index.html','my-library/installed/index.html','my-library/collections/index.html','my-library/updates/index.html','my-library/licenses/index.html'];
test('customer routes use accessible shared shell and no embedded entitlement data',()=>{for(const route of routes){assert.equal(existsSync(route),true,route);const html=readFileSync(route,'utf8');for(const token of ['class="skip-link"','<nav','<footer','data-my-library','Sign in required','Loading','No products yet','Update available','Runtime unavailable','License expired'])assert.match(html,new RegExp(token));assert.doesNotMatch(html,/ENT-[A-Z0-9]/);}});
test('client preserves prior render on refresh failure, exposes retry, and uses authenticated API transport',()=>{const js=readFileSync('assets/my-library.js','utf8');assert.match(js,/lastRendered/);assert.match(js,/lastSuccessAt/);assert.match(js,/data-library-retry/);assert.match(js,/marketplace-auth\.js/);assert.match(js,/authFetch/);});
