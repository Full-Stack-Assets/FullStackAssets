import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import { verifyAccessToken } from '../../../apps/marketplace-api/src/auth/oidc.mjs';
import { requireAppRole } from '../../../apps/marketplace-api/src/auth/authorize.mjs';

test('application roles are explicit and fail closed',()=>{
  assert.doesNotThrow(()=>requireAppRole({roles:['CUSTOMER']},['CUSTOMER']));
  assert.throws(()=>requireAppRole({roles:['CUSTOMER']},['PUBLISHER_ADMIN']),error=>error.code==='FORBIDDEN' && error.status===403);
});

async function fixture({issuer='https://issuer.example',audience='marketplace-api',kid='test-key',alg='RS256',expiresIn='5m'}={}){
  const {privateKey,publicKey}=await generateKeyPair('RS256');
  const jwk=await exportJWK(publicKey); jwk.kid='test-key'; jwk.alg='RS256'; jwk.use='sig';
  const token=await new SignJWT({email:'customer@example.test'}).setProtectedHeader({alg,kid}).setSubject('subject-123').setIssuer(issuer).setAudience(audience).setIssuedAt().setExpirationTime(expiresIn).sign(privateKey);
  return {token,jwks:{keys:[jwk]}};
}

test('verifyAccessToken validates issuer audience signature and subject',async()=>{
  const {token,jwks}=await fixture();
  const identity=await verifyAccessToken(token,{issuer:'https://issuer.example',audience:'marketplace-api',jwks,algorithms:['RS256']});
  assert.deepEqual(identity,{sub:'subject-123',issuer:'https://issuer.example',audience:'marketplace-api',email:'customer@example.test'});
});

test('verifyAccessToken rejects wrong issuer, wrong audience, and expired tokens',async()=>{
  const valid=await fixture();
  await assert.rejects(()=>verifyAccessToken(valid.token,{issuer:'https://wrong.example',audience:'marketplace-api',jwks:valid.jwks,algorithms:['RS256']}));
  await assert.rejects(()=>verifyAccessToken(valid.token,{issuer:'https://issuer.example',audience:'wrong-api',jwks:valid.jwks,algorithms:['RS256']}));
  const expired=await fixture({expiresIn:'0s'});
  await assert.rejects(()=>verifyAccessToken(expired.token,{issuer:'https://issuer.example',audience:'marketplace-api',jwks:expired.jwks,algorithms:['RS256']}));
});

test('verifyAccessToken rejects unknown kid and algorithms outside allowlist',async()=>{
  const unknown=await fixture({kid:'other-key'});
  await assert.rejects(()=>verifyAccessToken(unknown.token,{issuer:'https://issuer.example',audience:'marketplace-api',jwks:unknown.jwks,algorithms:['RS256']}));
  const valid=await fixture();
  await assert.rejects(()=>verifyAccessToken(valid.token,{issuer:'https://issuer.example',audience:'marketplace-api',jwks:valid.jwks,algorithms:['PS256']}));
});
