export function json(data,{status=200,headers={}}={}){
  return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8',...headers}});
}
export function errorResponse(status,code,message=code){return json({error:{code,message}},{status});}
export async function readJson(request){
  const type=request.headers.get('content-type')||'';
  if(!type.toLowerCase().includes('application/json')) throw Object.assign(new Error('JSON body required'),{status:415,code:'UNSUPPORTED_MEDIA_TYPE'});
  try{return await request.json();}catch{throw Object.assign(new Error('Invalid JSON'),{status:400,code:'INVALID_JSON'});}
}
