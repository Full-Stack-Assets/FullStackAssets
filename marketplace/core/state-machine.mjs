const ALLOWED = new Map([
  ['DRAFT', new Set(['VALIDATING','BLOCKED_SCHEMA','BLOCKED_DEPENDENCY','BLOCKED_POLICY','BLOCKED_RIGHTS'])],
  ['VALIDATING', new Set(['EVALUATING','BLOCKED_SCHEMA','BLOCKED_DEPENDENCY','BLOCKED_POLICY','BLOCKED_RIGHTS'])],
  ['EVALUATING', new Set(['COMMERCIAL_READY','BLOCKED_EVALUATION','BLOCKED_RUNTIME'])],
  ['COMMERCIAL_READY', new Set(['PUBLICATION_REVIEW','PUBLISHED','BLOCKED_POLICY','BLOCKED_RIGHTS'])],
  ['PUBLICATION_REVIEW', new Set(['PUBLISHED','BLOCKED_POLICY','BLOCKED_RIGHTS','SUSPENDED'])],
  ['PUBLISHED', new Set(['SUPERSEDED','RETIRED','SUSPENDED','SECURITY_BLOCKED'])],
  ['SUSPENDED', new Set(['PUBLISHED','RETIRED','SECURITY_BLOCKED'])],
  ['SECURITY_BLOCKED', new Set(['RETIRED'])],
  ['BLOCKED_SCHEMA', new Set(['DRAFT'])],
  ['BLOCKED_DEPENDENCY', new Set(['DRAFT'])],
  ['BLOCKED_EVALUATION', new Set(['EVALUATING','DRAFT'])],
  ['BLOCKED_RIGHTS', new Set(['DRAFT','COMMERCIAL_READY'])],
  ['BLOCKED_POLICY', new Set(['DRAFT','COMMERCIAL_READY'])],
  ['BLOCKED_RUNTIME', new Set(['EVALUATING','DRAFT'])],
  ['SUPERSEDED', new Set(['RETIRED'])],
  ['RETIRED', new Set()],
]);

export function transitionVersion(current, next) {
  const from = String(current).toUpperCase();
  const to = String(next).toUpperCase();
  if (!ALLOWED.has(from) || !ALLOWED.get(from).has(to)) {
    throw new Error(`INVALID_VERSION_TRANSITION:${from}->${to}`);
  }
  return to;
}
