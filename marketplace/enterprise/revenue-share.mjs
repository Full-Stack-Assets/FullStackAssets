export function validateRevenueSharePolicy(policy={}){
  const platform=Number(policy.platform_basis_points);const publisher=Number(policy.publisher_basis_points);
  if(!Number.isInteger(platform)||!Number.isInteger(publisher))throw new TypeError('REVENUE_SHARE_BASIS_POINTS_INTEGER_REQUIRED');
  if(platform<0||publisher<0||platform>10000||publisher>10000||platform+publisher!==10000)throw new TypeError('REVENUE_SHARE_TOTAL_INVALID');
  if(!['DRAFT','ACTIVE','RETIRED'].includes(String(policy.status)))throw new TypeError('REVENUE_SHARE_STATUS_INVALID');
  if(policy.status==='ACTIVE'&&!policy.approved_by)throw new TypeError('REVENUE_SHARE_APPROVAL_REQUIRED');
  return Object.freeze({...policy,platform_basis_points:platform,publisher_basis_points:publisher});
}

export function revenueShareAmounts(grossMinorUnits,policy){
  const p=validateRevenueSharePolicy(policy);const gross=Number(grossMinorUnits);
  if(!Number.isInteger(gross)||gross<0)throw new TypeError('GROSS_MINOR_UNITS_INVALID');
  const platform=Math.floor(gross*p.platform_basis_points/10000);return Object.freeze({gross_minor_units:gross,platform_minor_units:platform,publisher_minor_units:gross-platform});
}

export function executePayout(){throw new Error('AUTONOMOUS_PAYOUT_OUT_OF_SCOPE');}
