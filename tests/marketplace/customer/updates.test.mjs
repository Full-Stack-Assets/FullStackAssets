import test from 'node:test';
import assert from 'node:assert/strict';
import { computeUpdateState } from '../../../marketplace/customer/updates.mjs';
const base={ownedVersion:'1.4.0',activeVersion:'1.4.0',compatibility:{state:'VERIFIED'}};
for(const [name,args,expected] of [
 ['current',{},'CURRENT'],
 ['update',{activeVersion:'1.5.0'},'UPDATE_AVAILABLE'],
 ['breaking',{activeVersion:'2.0.0'},'BREAKING_UPDATE_AVAILABLE'],
 ['security',{installedAvailability:'SECURITY_BLOCKED',remediationAvailable:true,activeVersion:'1.4.1'},'SECURITY_UPDATE'],
 ['deprecated',{installedAvailability:'DEPRECATED'},'DEPRECATED'],
 ['retired',{installedAvailability:'RETIRED'},'RETIRED'],
 ['incompatible',{compatibility:{state:'BLOCKED'}},'INCOMPATIBLE_RUNTIME'],
]) test(name,()=>assert.equal(computeUpdateState({...base,...args}),expected));
test('security remediation has highest precedence',()=>assert.equal(computeUpdateState({...base,installedAvailability:'SECURITY_BLOCKED',activeAvailability:'RETIRED',compatibility:{state:'BLOCKED'},remediationAvailable:true,activeVersion:'1.4.1'}),'SECURITY_UPDATE'));
