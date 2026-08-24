import test from 'node:test';
import assert from 'node:assert/strict';
import {createOwnerBootstrapService} from '../../../apps/marketplace-api/src/services/owner-bootstrap.mjs';

function harness({state={app_users:0,active_roles:0,active_human_authority:0,active_publisher_memberships:0},authUsers=0,persistError=null,deleteError=null}={}){
  const calls={created:[],deleted:[],persisted:[]};
  const authAdmin={
    async countActiveUsers(){return authUsers;},
    async createConfirmedUser(email){calls.created.push(email);return {id:'11111111-2222-3333-4444-555555555555',email};},
    async deleteUser(id){calls.deleted.push(id);if(deleteError)throw deleteError;return true;},
  };
  const bootstrapRepository={
    async runExclusive(fn){
      return fn({
        async state(){return state;},
        async persistOwner(record){calls.persisted.push(record);if(persistError)throw persistError;return record;},
      });
    },
  };
  return {service:createOwnerBootstrapService({authAdmin,bootstrapRepository,issuer:'https://example.supabase.co/auth/v1'}),calls};
}

test('first bootstrap provisions only the approved owner records',async()=>{
  const {service,calls}=harness();
  const result=await service.bootstrap({email:' Owner@Example.COM '});
  assert.equal(result.status,'PROVISIONED');
  assert.equal(result.user_id,'USR-11111111-2222-3333-4444-555555555555');
  assert.equal(result.email,'owner@example.com');
  assert.deepEqual(calls.created,['owner@example.com']);
  assert.equal(calls.persisted.length,1);
  assert.deepEqual(calls.persisted[0],{
    user_id:'USR-11111111-2222-3333-4444-555555555555',
    issuer:'https://example.supabase.co/auth/v1',
    external_subject:'11111111-2222-3333-4444-555555555555',
    email:'owner@example.com',
    publisher_id:'PUB-001',
    publisher_role:'PUBLISHER_ADMIN',
    app_role:'MARKETPLACE_ADMIN',
    human_authority_scope:'MARKETPLACE_PUBLICATION',
    granted_by:'HUMAN_AUTHORITY',
    evidence_receipt_id:'EVID-OWNER-BOOTSTRAP-11111111-2222-3333-4444-555555555555',
  });
  assert.deepEqual(calls.deleted,[]);
});

test('bootstrap fails closed when auth or marketplace identity state is nonempty',async()=>{
  for(const fixture of [
    {authUsers:1},
    {state:{app_users:1,active_roles:0,active_human_authority:0,active_publisher_memberships:0}},
    {state:{app_users:0,active_roles:1,active_human_authority:0,active_publisher_memberships:0}},
    {state:{app_users:0,active_roles:0,active_human_authority:1,active_publisher_memberships:0}},
    {state:{app_users:0,active_roles:0,active_human_authority:0,active_publisher_memberships:1}},
  ]){
    const {service,calls}=harness(fixture);
    await assert.rejects(()=>service.bootstrap({email:'owner@example.com'}),error=>error.code==='OWNER_BOOTSTRAP_CLOSED'&&error.status===409);
    assert.deepEqual(calls.created,[]);
    assert.deepEqual(calls.persisted,[]);
  }
});

test('marketplace transaction failure deletes the newly created auth identity',async()=>{
  const {service,calls}=harness({persistError:Object.assign(new Error('db failed'),{code:'DB_FAILED'})});
  await assert.rejects(()=>service.bootstrap({email:'owner@example.com'}),/db failed/);
  assert.deepEqual(calls.deleted,['11111111-2222-3333-4444-555555555555']);
  assert.equal(calls.persisted.length,1);
});

test('failed auth rollback is explicit and never reported as successful bootstrap',async()=>{
  const {service,calls}=harness({persistError:new Error('db failed'),deleteError:new Error('delete failed')});
  await assert.rejects(()=>service.bootstrap({email:'owner@example.com'}),error=>error.code==='OWNER_BOOTSTRAP_ROLLBACK_FAILED'&&error.status===500);
  assert.equal(calls.deleted.length,1);
});

test('bootstrap rejects invalid owner email before any side effect',async()=>{
  const {service,calls}=harness();
  await assert.rejects(()=>service.bootstrap({email:'not-an-email'}),error=>error.code==='OWNER_EMAIL_INVALID'&&error.status===400);
  assert.deepEqual(calls.created,[]);
  assert.deepEqual(calls.persisted,[]);
});
