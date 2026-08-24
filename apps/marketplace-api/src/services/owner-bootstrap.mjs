function problem(message,{status=400,code='BAD_REQUEST',cause}={}){
  const error=new Error(message,{cause});
  error.status=status;
  error.code=code;
  return error;
}

function normalizeEmail(value){
  const email=String(value??'').trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw problem('A valid owner email is required',{status:400,code:'OWNER_EMAIL_INVALID'});
  return email;
}

function nonEmptyState(state={}){
  return ['app_users','active_roles','active_human_authority','active_publisher_memberships'].some(key=>Number(state[key]??0)>0);
}

export function createOwnerBootstrapService({authAdmin,bootstrapRepository,issuer}={}){
  if(!authAdmin?.countActiveUsers||!authAdmin?.createConfirmedUser||!authAdmin?.deleteUser||!bootstrapRepository?.runExclusive||!issuer){
    throw new TypeError('OWNER_BOOTSTRAP_DEPENDENCIES_REQUIRED');
  }
  return Object.freeze({
    async bootstrap({email}={}){
      const normalizedEmail=normalizeEmail(email);
      return bootstrapRepository.runExclusive(async(repo)=>{
        const [state,authUsers]=await Promise.all([repo.state(),authAdmin.countActiveUsers()]);
        if(nonEmptyState(state)||Number(authUsers)!==0)throw problem('Owner bootstrap is closed',{status:409,code:'OWNER_BOOTSTRAP_CLOSED'});
        const authUser=await authAdmin.createConfirmedUser(normalizedEmail);
        if(!authUser?.id)throw problem('Auth provider did not return a user id',{status:502,code:'OWNER_AUTH_CREATE_INVALID'});
        const userId=`USR-${authUser.id}`;
        const record={
          user_id:userId,
          issuer,
          external_subject:authUser.id,
          email:normalizedEmail,
          publisher_id:'PUB-001',
          publisher_role:'PUBLISHER_ADMIN',
          app_role:'MARKETPLACE_ADMIN',
          human_authority_scope:'MARKETPLACE_PUBLICATION',
          granted_by:'HUMAN_AUTHORITY',
          evidence_receipt_id:`EVID-OWNER-BOOTSTRAP-${authUser.id}`,
        };
        try{
          await repo.persistOwner(record);
        }catch(error){
          try{await authAdmin.deleteUser(authUser.id);}
          catch(rollbackError){throw problem('Owner bootstrap failed and Auth rollback also failed',{status:500,code:'OWNER_BOOTSTRAP_ROLLBACK_FAILED',cause:new AggregateError([error,rollbackError])});}
          throw error;
        }
        return Object.freeze({status:'PROVISIONED',user_id:userId,email:normalizedEmail,publisher_id:'PUB-001',app_role:'MARKETPLACE_ADMIN',publisher_role:'PUBLISHER_ADMIN',human_authority_scope:'MARKETPLACE_PUBLICATION'});
      });
    },
  });
}
