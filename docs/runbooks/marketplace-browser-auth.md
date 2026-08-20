# Marketplace Browser Authentication

The static Customer Library, Publisher Studio, and Enterprise Registry use Supabase Auth in the browser only for authentication. Authorization remains in the marketplace Edge API and database-backed role, membership, entitlement, publisher, and Human Authority records.

Production configuration:

- Supabase project: `fbwoqjxgyczsyjkbglbb`
- API: `https://fbwoqjxgyczsyjkbglbb.supabase.co/functions/v1/marketplace-api`
- Client credential: Supabase publishable key only. Never embed a secret/service-role key.
- Sign-in: passwordless email with `shouldCreateUser: false`; accounts must already exist or be provisioned through an approved administrative path.
- Session: Supabase browser session persistence and refresh.
- API requests: `Authorization: Bearer <access_token>`.
- Direct browser database access remains denied; RLS and revoked `anon`/`authenticated` table privileges remain fail-closed.
- Application roles and Human Authority are never inferred from browser claims; the API resolves them from production database records.

Live apex browser surfaces:

- `https://fullstackassets.com/my-library/`
- `https://fullstackassets.com/publisher/`
- `https://fullstackassets.com/enterprise/`

The canonical Pages host copies these route trees and `assets/marketplace-auth.js` from `Full-Stack-Assets/FullStackAssets@main`. My Library and Enterprise have been independently retrieved from the live apex and rendered the passwordless sign-in control; Publisher Studio has been independently retrieved at the live apex route. The Pages host validates the dynamic route roots and shared auth asset before deployment.

Paid commerce remains disabled until separately approved.
