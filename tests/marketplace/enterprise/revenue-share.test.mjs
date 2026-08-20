import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRevenueSharePolicy, revenueShareAmounts, executePayout } from '../../../marketplace/enterprise/revenue-share.mjs';

test('revenue share must total exactly 10000 basis points',()=>{
  const policy=validateRevenueSharePolicy({publisher_id:'PUB-2',platform_basis_points:2000,publisher_basis_points:8000,status:'ACTIVE',approved_by:'HUMAN-1'});
  assert.equal(policy.publisher_basis_points,8000);
  assert.throws(()=>validateRevenueSharePolicy({platform_basis_points:2000,publisher_basis_points:7000,status:'DRAFT'}),/REVENUE_SHARE_TOTAL_INVALID/);
});

test('active revenue share requires approval',()=>assert.throws(()=>validateRevenueSharePolicy({platform_basis_points:2000,publisher_basis_points:8000,status:'ACTIVE'}),/REVENUE_SHARE_APPROVAL_REQUIRED/));
test('allocation is deterministic but payout execution remains out of scope',()=>{
  assert.deepEqual(revenueShareAmounts(10000,{platform_basis_points:1500,publisher_basis_points:8500,status:'ACTIVE',approved_by:'HUMAN'}),{gross_minor_units:10000,platform_minor_units:1500,publisher_minor_units:8500});
  assert.throws(()=>executePayout(),/AUTONOMOUS_PAYOUT_OUT_OF_SCOPE/);
});
