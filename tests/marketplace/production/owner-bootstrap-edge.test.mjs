import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';

const path='supabase/functions/marketplace-owner-bootstrap/index.ts';

test('production owner bootstrap is server-authorized and one-time',()=>{
  assert.equal(existsSync(path),true,'owner bootstrap Edge function must exist');
  if(!existsSync(path))return;
  const source=readFileSync(path,'utf8');
  assert.match(source,/createOwnerBootstrapService/);
  assert.match(source,/SUPABASE_SECRET_KEY/);
  assert.match(source,/authorization/i);
  assert.match(source,/timingSafeEqual|secureEqual/);
  assert.match(source,/pg_advisory_xact_lock/);
  assert.match(source,/auth\.users/);
  assert.match(source,/OWNER_BOOTSTRAP_CLOSED/);
});

test('production bootstrap persists only the approved owner authority records',()=>{
  assert.equal(existsSync(path),true,'owner bootstrap Edge function must exist');
  if(!existsSync(path))return;
  const source=readFileSync(path,'utf8');
  assert.match(source,/PUB-001/);
  assert.match(source,/PUBLISHER_ADMIN/);
  assert.match(source,/MARKETPLACE_ADMIN/);
  assert.match(source,/MARKETPLACE_PUBLICATION/);
  assert.match(source,/HUMAN_AUTHORITY/);
  assert.doesNotMatch(source,/INSERT INTO entitlements/i);
  assert.doesNotMatch(source,/INSERT INTO runtime_distributions/i);
  assert.doesNotMatch(source,/MARKETPLACE_ALL/);
});

test('auth creation is confirmed server-side and supports compensating deletion',()=>{
  assert.equal(existsSync(path),true,'owner bootstrap Edge function must exist');
  if(!existsSync(path))return;
  const source=readFileSync(path,'utf8');
  assert.match(source,/email_confirm\s*:\s*true/);
  assert.match(source,/\/auth\/v1/);
  assert.match(source,/['"]\/admin\/users['"]/);
  assert.match(source,/method:\s*'DELETE'/);
  assert.doesNotMatch(source,/signUp\s*\(/);
});

test('bootstrap pool permits lock-holding transaction and independent auth-user count',()=>{
  assert.equal(existsSync(path),true,'owner bootstrap Edge function must exist');
  if(!existsSync(path))return;
  const source=readFileSync(path,'utf8');
  assert.match(source,/poolOptions:\{max:2\b/);
});
