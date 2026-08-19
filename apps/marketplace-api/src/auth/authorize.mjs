export function requireAppRole(context, allowedRoles) {
  const allowed = new Set((allowedRoles ?? []).map(String));
  const roles = Array.isArray(context?.roles) ? context.roles.map(String) : [];
  if (!allowed.size || !roles.some((role) => allowed.has(role))) {
    const error = new Error('Application role is not authorized for this action');
    error.code = 'FORBIDDEN';
    error.status = 403;
    throw error;
  }
  return context;
}
