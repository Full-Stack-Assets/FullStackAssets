export function installationKey({subject,productVersionId,runtime}){
  if(!subject?.type||!subject?.id||!productVersionId||!runtime) throw new TypeError('Installation identity is incomplete');
  return `${subject.type}:${subject.id}:${productVersionId}:${String(runtime).toUpperCase()}`;
}
export function normalizeInstallation(record){
  return Object.freeze({...record,runtime:String(record.runtime).toUpperCase(),status:String(record.status??'INSTALLED').toUpperCase()});
}
