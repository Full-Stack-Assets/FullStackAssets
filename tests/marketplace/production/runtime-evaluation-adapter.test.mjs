import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync('supabase/functions/marketplace-api/index.ts','utf8');

test('production distribution repository maps persisted evaluation fields into runtime evaluator contract',()=>{
  assert.match(source,/compatibility_result='VERIFIED'.*'PASS'/s);
  assert.match(source,/evidence_receipt_id AS receipt_id/);
  assert.match(source,/created_at AS evaluated_at/);
  assert.match(source,/0 AS critical_failures/);
});
