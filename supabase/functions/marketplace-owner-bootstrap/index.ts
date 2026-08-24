import {timingSafeEqual} from 'node:crypto';
import {createPostgres} from '../../../apps/marketplace-api/src/db/postgres.mjs';
import {createOwnerBootstrapService} from '../../../apps/marketplace-api/src/services/owner-bootstrap.mjs';

const required=(name:string)=>{const value=Deno.env.get(name)?.trim();if(!value)throw new Error(`${name}_REQUIRED`);return value;};
const SUPABASE_URL=required('SUPABASE_URL');
const SUPABASE_DB_URL=required('SUPABASE_DB_URL');
const SUPABASE_SECRET_KEY=(Deno.env.get('SUPABASE_SECRET_KEY')??Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')??'').trim();
if(!SUPABASE_SECRET_KEY)throw new Error('SUPABASE_SECRET_KEY_REQUIRED');
const issuer=`${SUPABASE_URL}/auth/v1`;
const db=createPostgres({connectionString:SUPABASE_DB_URL,poolOptions:{max:2,idleTimeoutMillis:10000,connectionTimeoutMillis:10000}});

function secureEqual(a:string,b:string){
  const aa=new TextEncoder().encode(a);const bb=new TextEncoder().encode(b);
  if(aa.byteLength!==bb.byteLength)return false;
  return timingSafeEqual(aa,bb);
}
function bearer(request:Request){const match=/^Bearer\s+(.+)$/i.exec(request.headers.get('authorization')??'');return match?.[1]?.trim()??'';}
function json(body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});}
async function authRequest(path:string,init:RequestInit={}){
  const headers=new Headers(init.headers);headers.set('authorization',`Bearer ${SUPABASE_SECRET_KEY}`);headers.set('apikey',SUPABASE_SECRET_KEY);headers.set('content-type','application/json');
  return fetch(`${SUPABASE_URL}/auth/v1${path}`,{...init,headers});
}

const authAdmin={
  async countActiveUsers(){const r=await db.query('SELECT count(*)::int AS count FROM auth.users WHERE deleted_at IS NULL');return Number(r.rows[0]?.count??0);},
  async createConfirmedUser(email:string){
    const response=await authRequest('/admin/users',{method:'POST',body:JSON.stringify({email,email_confirm:true})});
    if(!response.ok)throw Object.assign(new Error(`AUTH_CREATE_FAILED:${response.status}`),{status:502,code:'OWNER_AUTH_CREATE_FAILED'});
    const payload=await response.json();const user=payload?.user??payload;
    if(!user?.id)throw Object.assign(new Error('AUTH_CREATE_INVALID'),{status:502,code:'OWNER_AUTH_CREATE_INVALID'});
    return {id:String(user.id),email:String(user.email??email)};
  },
  async deleteUser(id:string){
    const response=await authRequest(`/admin/users/${encodeURIComponent(id)}`,{method:'DELETE',body:JSON.stringify({should_soft_delete:false})});
    if(!response.ok)throw new Error(`AUTH_DELETE_FAILED:${response.status}`);
    return true;
  },
};

const bootstrapRepository={
  async runExclusive(fn:(repo:any)=>Promise<unknown>){
    return db.transaction(async(tx:any)=>{
      await tx.query("SELECT pg_advisory_xact_lock(hashtext('marketplace-owner-bootstrap-v1'))");
      const repo={
        async state(){
          const r=await tx.query(`SELECT
            (SELECT count(*)::int FROM users) AS app_users,
            (SELECT count(*)::int FROM marketplace_app_roles WHERE status='ACTIVE') AS active_roles,
            (SELECT count(*)::int FROM marketplace_human_authority_grants WHERE status='ACTIVE' AND starts_at<=NOW() AND (expires_at IS NULL OR expires_at>NOW())) AS active_human_authority,
            (SELECT count(*)::int FROM publisher_memberships WHERE status='ACTIVE') AS active_publisher_memberships`);
          return r.rows[0]??{};
        },
        async persistOwner(record:any){
          const pub=await tx.query("SELECT id FROM publishers WHERE id='PUB-001' AND type='FIRST_PARTY' AND verification_state='VERIFIED'");
          if(!pub.rows[0])throw Object.assign(new Error('FIRST_PARTY_PUBLISHER_UNAVAILABLE'),{status:409,code:'FIRST_PARTY_PUBLISHER_UNAVAILABLE'});
          await tx.query("INSERT INTO users (id,issuer,external_subject,email,status) VALUES ($1,$2,$3,$4,'ACTIVE')",[record.user_id,record.issuer,record.external_subject,record.email]);
          await tx.query("INSERT INTO marketplace_app_roles (user_id,role,status,granted_by,evidence_receipt_id) VALUES ($1,'MARKETPLACE_ADMIN','ACTIVE','HUMAN_AUTHORITY',$2)",[record.user_id,record.evidence_receipt_id]);
          await tx.query("INSERT INTO publisher_memberships (id,publisher_id,user_id,app_role,status) VALUES ($1,'PUB-001',$2,'PUBLISHER_ADMIN','ACTIVE')",[`PM-OWNER-${record.external_subject}`,record.user_id]);
          await tx.query("INSERT INTO marketplace_human_authority_grants (id,user_id,scope,status,evidence_receipt_id,granted_by,starts_at) VALUES ($1,$2,'MARKETPLACE_PUBLICATION','ACTIVE',$3,'HUMAN_AUTHORITY',NOW())",[`HAG-OWNER-${record.external_subject}`,record.user_id,record.evidence_receipt_id]);
          return record;
        },
      };
      return fn(repo);
    });
  },
};

const service=createOwnerBootstrapService({authAdmin,bootstrapRepository,issuer});

const handle=async(request:Request)=>{
  if(request.method!=='POST')return json({error:{code:'METHOD_NOT_ALLOWED',message:'POST required'}},405);
  if(!secureEqual(bearer(request),SUPABASE_SECRET_KEY))return json({error:{code:'UNAUTHORIZED',message:'UNAUTHORIZED'}},401);
  try{
    const input=await request.json().catch(()=>({}));
    const result=await service.bootstrap({email:input?.email});
    return json(result,201);
  }catch(error:any){
    const status=Number(error?.status)||500;const code=String(error?.code??'INTERNAL_ERROR');
    const message=code==='OWNER_BOOTSTRAP_CLOSED'?'Owner bootstrap is closed':status<500?String(error?.message??code):'Internal error';
    return json({error:{code,message}},status);
  }
};

export default {fetch:handle};
Deno.serve(handle);
