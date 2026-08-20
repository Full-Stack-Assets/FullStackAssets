import http from 'node:http';
import { Readable } from 'node:stream';
import { createRouter } from './router.mjs';

export function nodeRequestToWeb(req,{origin='http://127.0.0.1'}={}){
  const method=req.method||'GET';
  const init={method,headers:req.headers};
  if(!['GET','HEAD'].includes(method)) { init.body=Readable.toWeb(req); init.duplex='half'; }
  return new Request(new URL(req.url||'/',origin),init);
}
export async function writeWebResponse(res,response){
  res.statusCode=response.status;
  response.headers.forEach((value,key)=>res.setHeader(key,value));
  if(!response.body){res.end();return;}
  for await(const chunk of Readable.fromWeb(response.body)) res.write(chunk);
  res.end();
}
export function startServer({port=3000,router=createRouter(),host='127.0.0.1'}={}){
  const server=http.createServer(async(req,res)=>writeWebResponse(res,await router(nodeRequestToWeb(req,{origin:`http://${req.headers.host||`${host}:${port}`}`}))));
  return new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,host,()=>resolve(server));});
}
