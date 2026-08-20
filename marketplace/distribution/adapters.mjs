import { SUPPORTED_RUNTIMES } from './manifest.mjs';

const BASE = Object.freeze({
  can_elevate_authority: false,
  can_mutate_canon: false,
  requires_evidence_receipt: true,
});

const DEFINITIONS = Object.freeze({
  UNIVERSAL: Object.freeze({...BASE, runtime:'UNIVERSAL', format:'universal-package', required_files:['manifest.json','README.md','LICENSE','CHANGELOG.md','canonical/','evaluations/','provenance/']}),
  CHATGPT: Object.freeze({...BASE, runtime:'CHATGPT', format:'chatgpt-skill-package', required_files:['SKILL.md','manifest.json'], supports_tools:true}),
  CURSOR: Object.freeze({...BASE, runtime:'CURSOR', format:'cursor-rules-package', required_files:['manifest.json','rules/'], supports_tools:true}),
  GEMINI: Object.freeze({...BASE, runtime:'GEMINI', format:'gemini-extension-package', required_files:['manifest.json','instructions.md'], supports_tools:true}),
  GROK: Object.freeze({...BASE, runtime:'GROK', format:'grok-agent-package', required_files:['manifest.json','instructions.md'], supports_tools:true}),
  MANUS: Object.freeze({...BASE, runtime:'MANUS', format:'manus-agent-package', required_files:['manifest.json','instructions.md'], supports_tools:true}),
  MCP: Object.freeze({...BASE, runtime:'MCP', format:'mcp-manifest-package', required_files:['manifest.json','mcp.json'], supports_tools:true}),
});

export function runtimeAdapter(runtime){
  const key=String(runtime??'').toUpperCase();
  return DEFINITIONS[key] ?? null;
}

export function listRuntimeAdapters(){
  return SUPPORTED_RUNTIMES.map((runtime)=>runtimeAdapter(runtime));
}

export function assertAdapterDoesNotEscalate({adapter,canonicalPermissions=[],runtimePermissions=[]}={}){
  if(!adapter) throw new TypeError('RUNTIME_ADAPTER_REQUIRED');
  const canonical=new Set(canonicalPermissions.map(String));
  const excess=runtimePermissions.map(String).filter((permission)=>!canonical.has(permission));
  if(adapter.can_elevate_authority!==false || adapter.can_mutate_canon!==false || excess.length){
    const error=new Error('RUNTIME_AUTHORITY_ESCALATION');
    error.code='RUNTIME_AUTHORITY_ESCALATION';
    error.excess_permissions=excess;
    throw error;
  }
  return true;
}
