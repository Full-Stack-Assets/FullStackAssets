import { errorResponse, json, readJson } from './http.mjs';

async function authenticate(request,services){return services.auth?.authenticate ? services.auth.authenticate(request) : null;}
function organizationId(url){return url.searchParams.get('organization_id')||null;}
export function createRouter({services={}}={}){
  return async function route(request){
    try{
      const url=new URL(request.url);const path=url.pathname;const method=request.method.toUpperCase();
      if(method==='GET'&&path==='/health')return json({status:'ok'});
      if(method==='POST'&&path==='/v1/payments/stripe/webhook'){
        if(!services.paymentEvents?.handle)return errorResponse(503,'PAYMENT_WEBHOOK_UNAVAILABLE');
        const rawBody=await request.text();const signature=request.headers.get('stripe-signature')||'';
        return json(await services.paymentEvents.handle({rawBody,signature}));
      }
      const context=await authenticate(request,services);if(!context)return errorResponse(401,'UNAUTHORIZED');
      if(method==='POST'&&path==='/v1/checkout')return json(await services.checkout.create(context,await readJson(request)),{status:201});
      if(method==='GET'&&path==='/v1/admin/readiness')return json(await services.readiness.get(context));
      const compatibilityMatch=/^\/v1\/product-versions\/([^/]+)\/compatibility$/.exec(path);
      if(method==='GET'&&compatibilityMatch){
        if(!services.distributions?.compatibility)return errorResponse(503,'DISTRIBUTION_SERVICE_UNAVAILABLE');
        const result=await services.distributions.compatibility(context,decodeURIComponent(compatibilityMatch[1]));
        return result?json(result):errorResponse(404,'VERSION_NOT_FOUND');
      }
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
      const publisher=services.publisher;
      if(method==='GET'&&path==='/v1/publisher/canon')return json(await publisher.listCanon(context));
      if(method==='GET'&&path==='/v1/publisher/candidates')return json(await publisher.listCandidates(context));
      const pp=/^\/v1\/publisher\/products\/([^/]+)$/.exec(path);if(method==='GET'&&pp)return json(await publisher.getProduct(context,decodeURIComponent(pp[1])));
      const offer=/^\/v1\/publisher\/products\/([^/]+)\/offers$/.exec(path);if(method==='POST'&&offer)return json(await publisher.createOffer(context,decodeURIComponent(offer[1]),await readJson(request)),{status:201});
      const evaluation=/^\/v1\/publisher\/products\/([^/]+)\/evaluations$/.exec(path);if(method==='POST'&&evaluation)return json(await publisher.submitEvaluation(context,decodeURIComponent(evaluation[1]),await readJson(request)),{status:201});
      const build=/^\/v1\/publisher\/products\/([^/]+)\/runtime-builds$/.exec(path);if(method==='POST'&&build)return json(await publisher.requestRuntimeBuild(context,decodeURIComponent(build[1]),await readJson(request)),{status:202});
      const review=/^\/v1\/publisher\/products\/([^/]+)\/publication-review$/.exec(path);if(method==='POST'&&review)return json(await publisher.requestPublicationReview(context,decodeURIComponent(review[1]),await readJson(request)),{status:201});
      const approve=/^\/v1\/publisher\/reviews\/([^/]+)\/approve$/.exec(path);if(method==='POST'&&approve)return json(await publisher.approve(context,decodeURIComponent(approve[1]),await readJson(request)));
      if(method==='POST'&&path==='/v1/publisher/canon-proposals')return json(await publisher.proposeCanonChange(context,await readJson(request)),{status:201});
      return errorResponse(404,'NOT_FOUND');
    }catch(error){return errorResponse(error.status||500,error.code||'INTERNAL_ERROR',error.status?error.message:'Internal error');}
  };
}
