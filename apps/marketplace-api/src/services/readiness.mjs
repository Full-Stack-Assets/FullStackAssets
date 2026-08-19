import { requireAppRole } from '../auth/authorize.mjs';

export function createReadinessService({checks={}}={}){
  return {
    async get(context){
      requireAppRole(context,['MARKETPLACE_ADMIN']);
      const result={};
      for(const [name,check] of Object.entries(checks)){
        try{result[name]=await check() ? 'PASS' : 'FAIL';}catch{result[name]='UNKNOWN';}
      }
      return result;
    },
  };
}
