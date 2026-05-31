# SpringVox Support Runbook

## Failed Upload Or Processing

1. Check `/platform/diagnostics`.
2. Check document status and `error_message`.
3. Confirm Inngest is running.
4. Confirm Voyage, Gemini, Qdrant, and Supabase credentials.

## Rate Limit Complaints

Check the user/workspace activity and recent `rate_limit.exceeded` system events. If legitimate beta usage is blocked, adjust limits in `src/lib/rate-limit.ts`.

## Workspace Deletion

Prefer scheduled deletion. Force deletion should only be used for test workspaces or confirmed offboarding.

## Email Issues

If Resend is not configured, notification creation should still work and email delivery is skipped.
