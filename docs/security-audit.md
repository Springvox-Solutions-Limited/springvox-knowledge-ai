# SpringVox Knowledge AI Security Audit

Date: 2026-05-25

## Scope

Phase 4 audit covered the current Next.js App Router application, Supabase access patterns, Qdrant retrieval boundaries, upload validation, environment variable exposure, trial access controls, user suspension controls, and dependency audit output.

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

## Confirmed Controls

- Service role key is only used in server modules and is not exposed through `NEXT_PUBLIC`.
- Qdrant searches continue to filter by `workspace_id`.
- Documents, chat sessions, sources, feedback, analytics, users, invitations, and uploads use authenticated server checks.
- Upload validation checks file extension, MIME type, and max file size.
- LlamaParse remains disabled by default through `LLAMAPARSE_ENABLED=false`.
- Chat sessions are resolved by `user_id` and `workspace_id`.
- Platform admin APIs require platform admin role before returning operational data.

## Dependency Audit

`npm audit --audit-level=moderate` reported:

- High: `xlsx` prototype pollution and ReDoS advisories. No fixed version is available from the package audit output.
- Moderate: `postcss` through `next`; suggested force fix would downgrade/change Next in a breaking way.
- Moderate: `qs` DoS advisory; fix available through `npm audit fix`.
- Moderate: `ws` memory disclosure advisory; fix available through `npm audit fix`.

## Remaining Risks

- `xlsx` has no audit fix available. Mitigation should focus on strict upload size limits, trusted admin-only uploads, parser row limits, and evaluating a safer XLSX parsing replacement before broad public rollout.
- Public/API rate limiting is still not implemented centrally. Add route-level or edge middleware rate limits before production beta.
- Security headers should be reviewed before production deployment.
- Trial billing/payment collection is not implemented yet; platform admins can manually activate/suspend/expire workspaces.
- Audit logs are write-only from server code and selectable by workspace admins through RLS, but no audit log UI exists yet.

## Cleanup Audit

No files were deleted in this pass. Static route/component review did not identify a confirmed unused file safe enough to remove without risking active pages, docs, migrations, or security-related behavior.
