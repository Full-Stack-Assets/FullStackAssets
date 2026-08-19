import { errorResponse, json, readJson } from './http.mjs';

async function authenticate(request,services){return services.auth?.authenticate ? services.auth.authenticate(request) : null;}
function organizationId(url){return url.searchParams.get('organization_id')||null;}
export function createRouter({services={}}={}){
  return async function route(request){
    try{
      const url=new URL(request.url);const path=url.pathname;const method=request.method.toUpperCase();
      if(method==='GET'&&path==='/health')return json({status:'ok'});
      const context=await authenticate(request,services);if(!context)return errorResponse(401,'UNAUTHORIZED');
      const library=services.customerLibrary;
      if(method==='GET'&&path==='/v1/me')return json(await library.getMe(context));
      if(method==='GET'&&path==='/v1/library')return json(await library.listLibrary(context,{organizationId:organizationId(url)}));
      if(method==='GET'&&path==='/v1/library/updates')return json(await library.listUpdates(context,{organizationId:organizationId(url)}));
      if(method==='GET'&&path==='/v1/installations')return json(await library.listInstallations(context,{organizationId:organizationId(url)}));
      if(method==='GET'&&path==='/v1/collections')return json(await library.listCollections(context,{organizationId:organizationId(url)}));
      if(method==='POST'&&path==='/v1/installations')return json(await library.createInstallation(context,await readJson(request)),{status:201});
      if(method==='POST'&&path==='/v1/collections')return json(await library.createCollection(context,await readJson(request)),{status:201});
      const collectionMatch=/^\/v1\/collections\/([^/]+)\/items$/.exec(path);
      if(method==='POST'&&collectionMatch)return json(await library.addCollectionItem(context,decodeURIComponent(collectionMatch[1]),await readJson(request)),{status:201});
      const downloadMatch=/^\/v1\/products\/([^/]+)\/versions\/([^/]+)\/download$/.exec(path);
      if(method==='GET'&&downloadMatch){const productId=decodeURIComponent(downloadMatch[1]);const version=decodeURIComponent(downloadMatch[2]);if(!services.catalog?.resolveProductVersion)return errorResponse(503,'CATALOG_UNAVAILABLE');const pv=await services.catalog.resolveProductVersion(productId,version);if(!pv)return errorResponse(404,'VERSION_NOT_FOUND');return json(await library.download(context,pv.id,url.searchParams.get('runtime')||'UNIVERSAL'));}
      return errorResponse(404,'NOT_FOUND');
    }catch(error){return errorResponse(error.status||500,error.code||'INTERNAL_ERROR',error.status?error.message:'Internal error');}
  };
}
