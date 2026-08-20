import { createLocalJWKSet, createRemoteJWKSet, jwtVerify } from 'jose';

function requiredString(value, name) {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${name} is required`);
  return value.trim();
}

function keySet(config) {
  if (config.jwks) return createLocalJWKSet(config.jwks);
  const uri = requiredString(config.jwksUri ?? config.jwks_uri, 'jwksUri');
  return createRemoteJWKSet(new URL(uri));
}

export async function verifyAccessToken(token, config = {}) {
  const issuer = requiredString(config.issuer, 'issuer');
  const audience = requiredString(config.audience, 'audience');
  if (typeof token !== 'string' || !token.trim()) throw new TypeError('token is required');
  const algorithms = config.algorithms ?? ['RS256'];
  if (!Array.isArray(algorithms) || algorithms.length === 0) throw new TypeError('algorithms allowlist is required');

  const { payload } = await jwtVerify(token, keySet(config), { issuer, audience, algorithms });
  if (typeof payload.sub !== 'string' || !payload.sub) throw new Error('OIDC_SUBJECT_REQUIRED');

  return {
    sub: payload.sub,
    issuer,
    audience,
    ...(typeof payload.email === 'string' ? { email: payload.email } : {}),
  };
}

export function oidcConfigFromEnv(env = process.env) {
  return {
    issuer: requiredString(env.OIDC_ISSUER, 'OIDC_ISSUER'),
    audience: requiredString(env.OIDC_AUDIENCE, 'OIDC_AUDIENCE'),
    jwksUri: requiredString(env.OIDC_JWKS_URI, 'OIDC_JWKS_URI'),
    algorithms: ['RS256'],
  };
}
