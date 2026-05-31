# SpringVox Knowledge AI Security Audit

Date: 2026-05-25

## Scope

Phase 4 and 5B audit covered the current Next.js App Router application, Supabase access patterns, Qdrant retrieval boundaries, upload validation, environment variable exposure, trial access controls, user suspension controls, beta rate limits, workspace deletion lifecycle, diagnostics, and dependency audit output.

## Findings

### Fixed

- Severity: High
- Area: Trial access control
- Finding: Workspaces did not have a first-class trial lifecycle gate.
- Fix applied: Added trial/subscription fields, server-side workspace access enforcement, dashboard blocked state, platform status control, and daily expiry job.

- Severity: High
- Area: User access control
- Finding: User accounts did not have a suspend/activate status gate.
- Fix applied: Added `profiles.status`, API enforcement, workspace/platform admin status controls, and audit log entries.

- Severity: Medium
- Area: Email secrets
- Finding: Trial lifecycle email provider configuration was not documented.
- Fix applied: Added `EMAIL_PROVIDER`, `RESEND_API_KEY`, and `EMAIL_FROM` to environment docs. Provider keys remain server-only.

- Severity: Medium
- Area: Debug logging
- Finding: Detailed RAG logs could expose question text and document metadata if left enabled.
- Fix applied: `RAG_DEBUG=false` is documented as default. Verbose retrieval logs only run when explicitly enabled.

- Severity: Medium
- Area: Required field validation
- Finding: Workspace onboarding relied on browser `required` plus server validation, but lacked clear inline messages.
- Fix applied: Added required markers, inline messages, and `aria-invalid` to required onboarding fields. Server validation remains in place.

- Severity: High
- Area: Rate limiting
- Finding: Public and high-cost API routes did not have central beta rate limits.
- Fix applied: Added Supabase-backed rate limits for chat, uploads, signup, platform APIs, notifications, and document deletion.

- Severity: Medium
- Area: Observability
- Finding: Operational failures were only visible through terminal/provider logs.
- Fix applied: Added `system_events`, safe logging helper, and `/platform/diagnostics`.

- Severity: Medium
- Area: Workspace data lifecycle
- Finding: Workspace offboarding did not have a safe deletion lifecycle.
- Fix applied: Added scheduled deletion, cancellation, force-delete event, Qdrant/storage/database cleanup, and audit log entries.

- Severity: Medium
- Area: Usage visibility
- Finding: Beta usage was not metered for billing/capacity planning.
- Fix applied: Added `workspace_usage_daily` and `/platform/usage`.

## Confirmed Controls

- Service role key is only used in server modules and is not exposed through `NEXT_PUBLIC`.
- Qdrant searches continue to filter by `workspace_id`.
- Documents, chat sessions, sources, feedback, analytics, users, invitations, and uploads use authenticated server checks.
- Upload validation checks file extension, MIME type, and max file size.
- LlamaParse remains disabled by default through `LLAMAPARSE_ENABLED=false`.
- Chat sessions are resolved by `user_id` and `workspace_id`.
- Platform admin APIs require platform admin role before returning operational data.
- Rate limit errors do not expose user IDs, IP addresses, or workspace identifiers.
- System event metadata redacts secret-like keys and truncates long strings.
- Workspace deletion does not physically delete `auth.users` by default.

## Dependency Audit

`npm audit --audit-level=moderate` reported:

- High: `xlsx` prototype pollution and ReDoS advisories. No fixed version is available from the package audit output.
- Moderate: `postcss` through `next`; suggested force fix would downgrade/change Next in a breaking way.
- Moderate: `qs` DoS advisory; fix available through `npm audit fix`.
- Moderate: `ws` memory disclosure advisory; fix available through `npm audit fix`.

## Remaining Risks

- `xlsx` has no audit fix available. Mitigation should focus on strict upload size limits, trusted admin-only uploads, parser row limits, and evaluating a safer XLSX parsing replacement before broad public rollout.
- Security headers should be reviewed before production deployment.
- CSP/security headers TODO: define strict `Content-Security-Policy`, HSTS, frame policy, and reporting before broad production rollout.
- Trial billing/payment collection is not implemented yet; platform admins can manually activate/suspend/expire workspaces.
- Secure storage policy checklist: verify the `documents` bucket is private, service-role-only for backend reads/writes, and tenant users never receive broad object paths.
- RLS policy review checklist: rerun Supabase linter after Phase 5B migration and confirm new operational tables are not directly accessible to tenant users except through APIs.
- Backup/recovery checklist: define retention and restore drills before enabling destructive workspace deletion in production.
- Secret scanning checklist: run provider and GitHub secret scans before beta invite expansion.

## Supabase Dashboard Actions

Enable leaked password protection manually in Supabase:

Supabase Dashboard -> Authentication -> Password Security -> Enable leaked password protection.

This is a Supabase Auth configuration setting, not a SQL migration. Do not attempt to enable it through SQL unless Supabase exposes an official SQL-supported configuration path for the project.

## Cleanup Audit

No files were deleted in this pass. Static route/component review did not identify a confirmed unused file safe enough to remove without risking active pages, docs, migrations, or security-related behavior.
