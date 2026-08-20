import { createRouter } from '../../../apps/marketplace-api/src/router.mjs';
import { createPostgres } from '../../../apps/marketplace-api/src/db/postgres.mjs';
import { createCustomerRepository } from '../../../apps/marketplace-api/src/db/customer-repository.mjs';
import { verifyAccessToken } from '../../../apps/marketplace-api/src/auth/oidc.mjs';
import { createCustomerLibraryService } from '../../../apps/marketplace-api/src/services/customer-library.mjs';
import { createDownloadService } from '../../../apps/marketplace-api/src/services/downloads.mjs';
import { createDistributionService } from '../../../apps/marketplace-api/src/services/distributions.mjs';
import { createEnterpriseService } from '../../../apps/marketplace-api/src/services/enterprise.mjs';
import { createPublisherService } from '../../../apps/marketplace-api/src/services/publisher.mjs';
import { createReadinessService } from '../../../apps/marketplace-api/src/services/readiness.mjs';

const required=(name:string)=>{const value=Deno.env.get(name)?.trim();if(!value)throw new Error(`${name}_REQUIRED`);return value;};
const SUPABASE_URL=required('SUPABASE_URL');
const SUPABASE_DB_URL=required('SUPABASE_DB_URL');
const SUPABASE_JWKS=JSON.parse(required('SUPABASE_JWKS'));
const SUPABASE_SECRET_KEY=(Deno.env.get('SUPABASE_SECRET_KEY')??Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')??'').trim();
const ARTIFACT_BUCKET='marketplace-artifacts';
const HUMAN_AUTHORITY_SCOPES=['MARKETPLACE_PUBLICATION','MARKETPLACE_ALL'];
const db=createPostgres({connectionString:SUPABASE_DB_URL,poolOptions:{max:4,idleTimeoutMillis:10000,connectionTimeoutMillis:10000}});

function bearer(request:Request){const value=request.headers.get('authorization')??'';const match=/^Bearer\s+(.+)$/i.exec(value);return match?.[1]?.trim()??null;}
function unique(values:unknown[]){return [...new Set(values.filter(Boolean).map(String))].sort();}
function normalizeRequest(request:Request){
  const incoming=new URL(request.url);const marker='/marketplace-api';const pos=incoming.pathname.indexOf(marker);
  if(pos>=0){const suffix=incoming.pathname.slice(pos+marker.length)||'/';incoming.pathname=suffix.startsWith('/')?suffix:`/${suffix}`;}
  return new Request(incoming,request);
}
function allowedOrigin(request:Request){const origin=request.headers.get('origin');const configured=(Deno.env.get('MARKETPLACE_ALLOWED_ORIGINS')??'https://fullstackassets.com').split(',').map(x=>x.trim()).filter(Boolean);return origin&&configured.includes(origin)?origin:null;}
function cors(response:Response,origin:string|null){const headers=new Headers(response.headers);if(origin){headers.set('access-control-allow-origin',origin);headers.set('vary','Origin');headers.set('access-control-allow-credentials','true');}headers.set('access-control-allow-headers','authorization,content-type,stripe-signature');headers.set('access-control-allow-methods','GET,POST,OPTIONS');return new Response(response.body,{status:response.status,statusText:response.statusText,headers});}

async function authenticate(request:Request){
  const token=bearer(request);if(!token)return null;
  const issuer=`${SUPABASE_URL}/auth/v1`;
  const claims=await verifyAccessToken(token,{issuer,audience:'authenticated',jwks:SUPABASE_JWKS,algorithms:['ES256','RS256']});
  const internalId=`USR-${claims.sub}`;
  const userResult=await db.query(`INSERT INTO users (id,issuer,external_subject,email,status) VALUES ($1,$2,$3,$4,'ACTIVE') ON CONFLICT (issuer,external_subject) DO UPDATE SET email=COALESCE(EXCLUDED.email,users.email),updated_at=NOW() RETURNING *`,[internalId,issuer,claims.sub,claims.email??null]);
  const user=userResult.rows[0];
  const [membershipRows,publisherRows,roleRows,authorityRows]=await Promise.all([
    db.query("SELECT * FROM memberships WHERE user_id=$1 AND status='ACTIVE' ORDER BY organization_id",[user.id]),
    db.query("SELECT * FROM publisher_memberships WHERE user_id=$1 AND status='ACTIVE' ORDER BY publisher_id",[user.id]),
    db.query("SELECT role FROM marketplace_app_roles WHERE user_id=$1 AND status='ACTIVE' ORDER BY role",[user.id]),
    db.query("SELECT id,scope FROM marketplace_human_authority_grants WHERE user_id=$1 AND status='ACTIVE' AND starts_at<=NOW() AND (expires_at IS NULL OR expires_at>NOW()) AND scope=ANY($2::text[]) ORDER BY created_at DESC",[user.id,HUMAN_AUTHORITY_SCOPES]),
  ]);
  const memberships=membershipRows.rows;const publisher_memberships=publisherRows.rows;
  const roles=unique([...roleRows.rows.map((r:any)=>r.role),...memberships.map((m:any)=>m.app_role),...publisher_memberships.map((m:any)=>m.app_role)]);
  return {user,subject:{type:'USER',id:user.id},roles,memberships,publisher_memberships,human_authority:authorityRows.rows.length>0,human_authority_grant_ids:authorityRows.rows.map((r:any)=>r.id)};
}

const customerRepository=createCustomerRepository(db);

const catalogRepository={
  async getProduct(id:string){const r=await db.query('SELECT * FROM products WHERE id=$1',[id]);return r.rows[0]??null;},
  async getProductVersion(id:string){const r=await db.query('SELECT * FROM product_versions WHERE id=$1',[id]);return r.rows[0]??null;},
  async resolveProductVersion(productId:string,version:string){const r=await db.query('SELECT * FROM product_versions WHERE product_id=$1 AND version=$2',[productId,version]);return r.rows[0]??null;},
  async getRuntimeDistribution(productVersionId:string,runtime:string){const r=await db.query('SELECT *,package_location AS artifact_id FROM runtime_distributions WHERE product_version_id=$1 AND runtime=$2 ORDER BY updated_at DESC LIMIT 1',[productVersionId,runtime]);return r.rows[0]??null;},
};

const distributionRepository={
  ...catalogRepository,
  async listRuntimeDistributions(productVersionId:string){const r=await db.query('SELECT * FROM runtime_distributions WHERE product_version_id=$1 ORDER BY runtime,adapter_version',[productVersionId]);return r.rows;},
  async listRuntimeEvaluations(productVersionId:string){const r=await db.query('SELECT * FROM evaluation_records WHERE product_version_id=$1 ORDER BY created_at,id',[productVersionId]);return r.rows;},
};

function storagePath(path:string){return path.split('/').map(encodeURIComponent).join('/');}
const artifactStore={
  async getMetadata(key:string){if(!key)return null;const r=await db.query('SELECT name,metadata,user_metadata,created_at,updated_at FROM storage.objects WHERE bucket_id=$1 AND name=$2',[ARTIFACT_BUCKET,key]);if(!r.rows[0])return null;const match=/\/([A-Fa-f0-9]{64})\//.exec(`/${key}/`);return {...r.rows[0],key,sha256:match?.[1]?.toLowerCase()??r.rows[0]?.user_metadata?.sha256??null};},
  async createReadGrant(key:string,{expiresInSeconds=60}:{expiresInSeconds?:number}={}){if(!SUPABASE_SECRET_KEY)throw new Error('SUPABASE_SECRET_KEY_REQUIRED');const response=await fetch(`${SUPABASE_URL}/storage/v1/object/sign/${ARTIFACT_BUCKET}/${storagePath(key)}`,{method:'POST',headers:{authorization:`Bearer ${SUPABASE_SECRET_KEY}`,apikey:SUPABASE_SECRET_KEY,'content-type':'application/json'},body:JSON.stringify({expiresIn:expiresInSeconds})});if(!response.ok)throw new Error(`STORAGE_SIGN_FAILED:${response.status}`);const payload=await response.json();const signed=String(payload.signedURL??payload.signedUrl??'');if(!signed)throw new Error('STORAGE_SIGN_URL_MISSING');return {url:signed.startsWith('http')?signed:`${SUPABASE_URL}${signed}`,expires_in_seconds:expiresInSeconds};},
};

const enterpriseRepository={
  async getRegistry(id:string){const r=await db.query('SELECT * FROM private_registries WHERE id=$1',[id]);return r.rows[0]??null;},
  async listRegistryProducts(id:string){const r=await db.query('SELECT * FROM private_registry_products WHERE registry_id=$1 ORDER BY created_at,id',[id]);return r.rows;},
  async getProduct(id:string){return catalogRepository.getProduct(id);},
  async getCanonicalOrganizationPolicy(organizationId:string){const r=await db.query('SELECT canonical_policy FROM organization_canonical_policies WHERE organization_id=$1',[organizationId]);return r.rows[0]?.canonical_policy??{allowed_runtimes:[],permissions:[],allowed_publishers:[],max_risk_tier:'RESTRICTED'};},
  async getEnterprisePolicyOverlay(organizationId:string){const r=await db.query('SELECT * FROM enterprise_policy_overlays WHERE organization_id=$1 ORDER BY created_at DESC LIMIT 1',[organizationId]);return r.rows[0]??null;},
};

const publisherRepository={
  async listPublisherCanon(publisherId:string){const r=await db.query('SELECT p.*,pv.id AS product_version_id,pv.version,pv.canonical_hash,pv.publication_state FROM products p LEFT JOIN LATERAL (SELECT * FROM product_versions v WHERE v.product_id=p.id ORDER BY v.created_at DESC LIMIT 1) pv ON TRUE WHERE p.publisher_id=$1 ORDER BY p.id',[publisherId]);return r.rows;},
  async listCandidates(publisherId:string){const r=await db.query('SELECT * FROM commercial_candidates WHERE publisher_id=$1 ORDER BY updated_at DESC,id',[publisherId]);return r.rows;},
  async getPublisherProduct(publisherId:string,id:string){const r=await db.query('SELECT * FROM products WHERE publisher_id=$1 AND id=$2',[publisherId,id]);return r.rows[0]??null;},
  async createOffer(input:any){const r=await db.query('INSERT INTO offers (id,product_id,license_policy_id,offer_class,currency,amount_minor,active) VALUES ($1,$2,$3,$4,$5,$6,FALSE) RETURNING *',[input.id,input.product_id,input.license_policy_id,input.offer_class,input.currency??null,input.amount_minor??null]);return r.rows[0];},
  async createEvaluation(input:any){if(!input.product_version_id)throw Object.assign(new Error('PRODUCT_VERSION_REQUIRED'),{status:400,code:'PRODUCT_VERSION_REQUIRED'});const r=await db.query(`INSERT INTO evaluation_records (id,product_version_id,runtime,fixture_set,rubric,score,policy_failures,provenance_complete,compatibility_result,evaluator_id,evidence_receipt_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,[input.id,input.product_version_id,input.runtime??null,input.fixture_set??[],input.rubric??{},input.score??null,input.policy_failures??[],Boolean(input.provenance_complete),input.compatibility_result??null,input.evaluator_id??null,input.evidence_receipt_id]);return r.rows[0];},
  async createRuntimeBuild(input:any){if(!input.product_version_id)throw Object.assign(new Error('PRODUCT_VERSION_REQUIRED'),{status:400,code:'PRODUCT_VERSION_REQUIRED'});const id=input.id??`RB-${crypto.randomUUID()}`;const r=await db.query(`INSERT INTO runtime_build_jobs (id,publisher_id,product_version_id,runtime,adapter_version,state,artifact_hash) VALUES ($1,$2,$3,$4,$5,'QUEUED',$6) ON CONFLICT (product_version_id,runtime,adapter_version) DO UPDATE SET state='QUEUED' RETURNING *`,[id,input.publisher_id,input.product_version_id,String(input.runtime).toUpperCase(),input.adapter_version??'',input.artifact_hash??null]);return r.rows[0];},
  async createPublicationReview(input:any){if(!input.product_version_id||!input.expected_version_hash)throw Object.assign(new Error('REVIEW_BINDING_REQUIRED'),{status:400,code:'REVIEW_BINDING_REQUIRED'});const r=await db.query(`INSERT INTO publication_reviews (id,publisher_id,product_version_id,expected_version_hash,packet,status) VALUES ($1,$2,$3,$4,$5,'PENDING') RETURNING *`,[input.id,input.publisher_id,input.product_version_id,input.expected_version_hash,input.packet??{}]);return r.rows[0];},
  async approveReview(reviewId:string,{reviewer_id,expected_version_hash}:{reviewer_id:string,expected_version_hash:string}){return db.transaction(async(tx:any)=>{const rr=await tx.query('SELECT * FROM publication_reviews WHERE id=$1 FOR UPDATE',[reviewId]);const review=rr.rows[0];if(!review||review.status!=='PENDING')throw Object.assign(new Error('REVIEW_NOT_PENDING'),{status:409,code:'REVIEW_NOT_PENDING'});const vr=await tx.query('SELECT * FROM product_versions WHERE id=$1 FOR UPDATE',[review.product_version_id]);const version=vr.rows[0];if(!version||version.canonical_hash!==review.expected_version_hash||version.canonical_hash!==expected_version_hash){await tx.query("UPDATE publication_reviews SET status='STALE',decided_at=NOW() WHERE id=$1",[reviewId]);throw Object.assign(new Error('STALE_VERSION'),{status:409,code:'STALE_VERSION'});}await tx.query("UPDATE publication_reviews SET status='APPROVED',reviewer_id=$2,decided_at=NOW() WHERE id=$1",[reviewId,reviewer_id]);await tx.query("UPDATE product_versions SET publication_state='PUBLISHED',updated_at=NOW() WHERE id=$1",[version.id]);await tx.query("INSERT INTO product_version_availability (product_version_id,availability_state,updated_at) VALUES ($1,'ACTIVE',NOW()) ON CONFLICT (product_version_id) DO UPDATE SET availability_state='ACTIVE',updated_at=NOW()",[version.id]);return {...review,status:'APPROVED',reviewer_id};});},
  async createCanonProposal(input:any){const r=await db.query('INSERT INTO canon_change_proposals (id,publisher_id,canonical_ref,proposed_patch,status,created_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',[input.id,input.publisher_id,input.canonical_ref,input.proposed_patch,input.status,input.created_by]);return r.rows[0];},
  async audit(input:any){const id=input.id??`PAE-${crypto.randomUUID()}`;await db.query('INSERT INTO publisher_audit_events (id,publisher_id,actor_id,object_ref,action,before_hash,after_hash,result,correlation_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',[id,input.publisher_id,input.actor_id,input.object_ref,input.action,input.before_hash??null,input.after_hash??null,input.result,input.correlation_id]);return {id};},
};

const downloadService=createDownloadService({customerRepository,catalogRepository,artifactStore});
const customerLibrary=createCustomerLibraryService({customerRepository,catalogRepository,downloadService});
const distributions=createDistributionService({repo:distributionRepository});
const enterprise=createEnterpriseService({repo:enterpriseRepository});
const publisher=createPublisherService({repo:publisherRepository});
const readiness=createReadinessService({checks:{database:async()=>Boolean((await db.query('SELECT 1 AS ok')).rows[0]?.ok),storage:async()=>Boolean((await db.query('SELECT 1 FROM storage.buckets WHERE id=$1',[ARTIFACT_BUCKET])).rows[0]),auth:async()=>Boolean(SUPABASE_JWKS?.keys?.length),schema:async()=>Boolean((await db.query("SELECT to_regclass('public.marketplace_app_roles') AS roles,to_regclass('public.private_registries') AS registries")).rows[0]?.roles)}});
const commerceDisabled={async create(){throw Object.assign(new Error('Paid launch is not enabled'),{status:503,code:'COMMERCE_DISABLED'});}};
const router=createRouter({services:{auth:{authenticate},customerLibrary,catalog:catalogRepository,distributions,enterprise,publisher,readiness,checkout:commerceDisabled}});

const handle=async(request:Request)=>{
  const origin=allowedOrigin(request);
  if(request.method==='OPTIONS')return cors(new Response(null,{status:204}),origin);
  return cors(await router(normalizeRequest(request)),origin);
};

export default {fetch:handle};
Deno.serve(handle);
