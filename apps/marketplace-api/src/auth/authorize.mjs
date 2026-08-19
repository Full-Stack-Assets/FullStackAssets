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

export function requireOrganizationMembership(context, organizationId, {admin=false}={}) {
  const membership=(context?.memberships??[]).find((item)=>item.organization_id===organizationId && item.status!=='REVOKED');
  if(!membership || (admin && membership.app_role!=='ORG_ADMIN')) {
    const error=new Error('Organization membership is not authorized for this action');
    error.code='FORBIDDEN';
    error.status=403;
    throw error;
  }
  return membership;
}
