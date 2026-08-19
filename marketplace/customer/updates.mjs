function semver(value){const m=/^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(String(value));if(!m) throw new TypeError(`Invalid semantic version: ${value}`);return m.slice(1,4).map(Number);}
function compare(a,b){for(let i=0;i<3;i++){if(a[i]!==b[i]) return a[i]-b[i];}return 0;}
export function computeUpdateState({ownedVersion,activeVersion,compatibility={},installedAvailability='ACTIVE',activeAvailability='ACTIVE',remediationAvailable=false}){
  const owned=semver(typeof ownedVersion==='string'?ownedVersion:ownedVersion.version);
  const active=semver(typeof activeVersion==='string'?activeVersion:activeVersion.version);
  if(installedAvailability==='SECURITY_BLOCKED'&&remediationAvailable) return 'SECURITY_UPDATE';
  if(installedAvailability==='RETIRED'||activeAvailability==='RETIRED') return 'RETIRED';
  if(installedAvailability==='DEPRECATED'||activeAvailability==='DEPRECATED'||compatibility.state==='DEPRECATED') return 'DEPRECATED';
  if(['UNAVAILABLE','BLOCKED'].includes(compatibility.state)) return 'INCOMPATIBLE_RUNTIME';
  if(compare(active,owned)<=0) return 'CURRENT';
  if(active[0]!==owned[0]) return 'BREAKING_UPDATE_AVAILABLE';
  return 'UPDATE_AVAILABLE';
}
