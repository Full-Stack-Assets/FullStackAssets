function push(reasons, condition, code) { if (condition) reasons.push(code); }

export function publicationDecision(context = {}) {
  const blocking = [];
  push(blocking, context.provenance_complete !== true, 'PROVENANCE_INCOMPLETE');
  push(blocking, context.rights_known !== true, 'RIGHTS_UNKNOWN');
  push(blocking, context.evaluation_passed !== true, 'EVALUATION_FAILED');
  if (blocking.length) return { decision:'BLOCK', reasons:blocking };

  const reasons = [];
  const risk = String(context.risk_tier ?? '').toUpperCase();
  const commercial = String(context.commercial_state ?? '').toUpperCase();
  const severity = String(context.change_severity ?? '').toUpperCase();
  const tier = String(context.permission_tier ?? '').toUpperCase();
  push(reasons, commercial === 'PAID' || context.commercial_terms_changed === true, 'PAID_ACTIVATION_REQUIRES_HUMAN');
  push(reasons, severity === 'MAJOR', 'MAJOR_CHANGE_REQUIRES_HUMAN');
  push(reasons, risk === 'MODERATE', 'MODERATE_RISK_REQUIRES_HUMAN');
  push(reasons, risk === 'HIGH', 'HIGH_RISK_REQUIRES_HUMAN');
  push(reasons, risk === 'RESTRICTED', 'RESTRICTED_RISK_REQUIRES_HUMAN');
  push(reasons, context.new_authority === true, 'NEW_AUTHORITY_REQUIRES_HUMAN');
  push(reasons, tier === 'I3', 'I3_REQUIRES_HUMAN');
  push(reasons, tier === 'I4', 'I4_REQUIRES_HUMAN');
  push(reasons, context.sensitive_data_change === true, 'SENSITIVE_DATA_CHANGE_REQUIRES_HUMAN');
  push(reasons, context.external_action_change === true, 'EXTERNAL_ACTION_CHANGE_REQUIRES_HUMAN');
  push(reasons, context.security_sensitive === true, 'SECURITY_SENSITIVE_CHANGE_REQUIRES_HUMAN');
  push(reasons, context.policy_exception === true, 'POLICY_EXCEPTION_REQUIRES_HUMAN');
  push(reasons, context.new_third_party_publisher === true, 'NEW_THIRD_PARTY_PUBLISHER_REQUIRES_HUMAN');
  push(reasons, context.publisher_auto_eligible !== true, 'PUBLISHER_NOT_AUTO_ELIGIBLE');
  if (reasons.length) return { decision:'HUMAN_REVIEW', reasons };

  if (risk !== 'LOW') return { decision:'HUMAN_REVIEW', reasons:['UNCLASSIFIED_RISK_REQUIRES_HUMAN'] };
  if (!['FREE'].includes(commercial)) return { decision:'HUMAN_REVIEW', reasons:['COMMERCIAL_STATE_REQUIRES_HUMAN'] };
  if (!['PATCH','MINOR'].includes(severity)) return { decision:'HUMAN_REVIEW', reasons:['CHANGE_SEVERITY_REQUIRES_HUMAN'] };
  return { decision:'AUTO', reasons:[] };
}
