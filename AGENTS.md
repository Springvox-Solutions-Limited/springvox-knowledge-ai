# Agent Instructions — Rekall-IQ

This file is read by AI coding agents (Codex, Devin, Claude, etc.) at the start of sessions.

## Canonical guidance
See `CLAUDE.md` for the full developer and security ruleset.
See `DESIGN.md` for the visual design contract.
See `docs/architecture-guide.md` for system architecture.

## Stack summary
Next.js 16 · Supabase (Postgres + Auth + Storage) · Qdrant (vector) · Gemini + Voyage (AI) · Inngest (jobs) · Vercel (deploy)

## Critical invariants every agent must respect
1. All Supabase queries scoped by `workspace_id` — no cross-tenant data access
2. `getSupabaseAdmin()` is server-only — never import in client components
3. RLS enabled on every table — never disable or bypass
4. File at `server-only` boundary: `src/lib/supabase-server.ts`, `src/lib/platform-server.ts`
5. `INNGEST_DEV=1` must never appear in Vercel env vars
6. Never commit secrets — `.env` is gitignored, production secrets live in Vercel only
7. Security skill: `.skills/security/skill.md` — read before writing security-sensitive code
8. Design contract: `DESIGN.md` — read before writing frontend code

## Validation before finishing any task
```bash
npx tsc --noEmit   # 0 errors required
npm run build      # must succeed
npm run lint       # must pass
```
