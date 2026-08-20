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

Paid commerce remains disabled until separately approved.
