# Beta Readiness Checklist

- [ ] Run all SQL migrations through `sql/phase5b_beta_hardening.sql`.
- [ ] Confirm `.env` does not expose secrets with `NEXT_PUBLIC`.
- [ ] Confirm Inngest is reachable.
- [ ] Confirm Qdrant collection matches embedding dimensions.
- [ ] Upload and query PDF, DOCX, XLSX, CSV, PPTX.
- [ ] Verify rate limits return friendly 429 responses.
- [ ] Verify `/platform/usage` records chat/upload activity.
- [ ] Verify `/dashboard/evaluations` can create and run an eval set.
- [ ] Verify `/platform/diagnostics` shows system events.
- [ ] Test workspace deletion on a disposable workspace only.
- [ ] Enable Supabase leaked password protection.
- [ ] Review unresolved `xlsx` audit risk.
