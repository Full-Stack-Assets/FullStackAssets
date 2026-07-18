# Security Policy

TaskFlow is pre-production reference software. Do not submit secrets, regulated data, or real customer PII to the demonstration deployment.

## Reporting

Report suspected vulnerabilities privately to the repository owner. Include the affected commit, reproduction steps, impact, and any suggested mitigation. Do not open a public issue containing credentials, private run records, or exploit details.

## Supported version

Only the latest commit on the active feature or default branch is evaluated for security fixes during pre-release development.

## Deployment responsibility

Operators are responsible for authentication, authorization, durable encrypted storage, TLS, secret management, rate limiting, backups, monitoring, and legal/compliance review. See [Threat model](docs/threat-model.md).
