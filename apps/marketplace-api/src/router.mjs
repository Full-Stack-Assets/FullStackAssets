import { errorResponse, json } from './http.mjs';

async function authContext(request,services){
  if(!services.auth?.authenticate) return null;
  return services.auth.authenticate(request);
}
export function createRouter({services={}}={}){
  return async function route(request){
    try{
      const url=new URL(request.url);
      if(request.method==='GET' && url.pathname==='/health') return json({status:'ok'});
      if(request.method==='GET' && url.pathname==='/v1/me'){
        const context=await authContext(request,services);
        if(!context) return errorResponse(401,'UNAUTHORIZED');
        const me=services.customerLibrary?.getMe ? await services.customerLibrary.getMe(context) : context;
        return json(me);
      }
      return errorResponse(404,'NOT_FOUND');
    }catch(error){return errorResponse(error.status||500,error.code||'INTERNAL_ERROR',error.status?error.message:'Internal error');}
  };
}
