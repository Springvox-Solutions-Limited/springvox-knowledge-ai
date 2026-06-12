# Claude Code — Rekall-IQ

## Read First

At the start of every session, read these files in order:
1. `README.md` — project overview and current status
2. `DESIGN.md` — visual design contract (never deviate without updating this first)
3. `docs/security_report.md` — latest security audit, score, and open issues
4. `docs/beta-readiness-checklist.md` — what's done and what's blocking launch
5. `memory-security.md` — security state history and accepted risks

Then read any relevant domain docs before touching that area:
- `docs/architecture-guide.md` before touching data flow or Supabase schema
- `docs/backend-architecture.md` before touching API routes or Inngest
- `docs/frontend-design.md` before touching dashboard components

---

## 🔐 Security Skill Active

This project uses security-skill for automated security engineering.

**Available commands:**
| Command | Description |
|---------|-------------|
| `/security-scan` | Quick scan — critical issues only |
| `/security-audit` | Full audit — complete score + report saved to `docs/security_report.md` |
| `/security-fix` | Apply fixes from last audit (with confirmations) |
| `/security-status` | Show current score and last audit date |
| `/security-incident` | Launch incident response playbook |

**Security skill instructions:** `.skills/security/skill.md`
**Security memory:** `memory-security.md`

You are acting as both developer assistant AND security engineer. Proactively flag security issues in all code you write or review.

---

## Stack — Do Not Change Without Discussion

| Layer | Technology | Rules |
|-------|-----------|-------|
| Framework | Next.js 16 (App Router) | Never add Pages Router files |
| Styling | Tailwind CSS v4 | No Chakra UI, no MUI, no CSS-in-JS |
| Components | shadcn/ui + custom app-* components | Extend, never replace |
| Database | Supabase (Postgres + Auth + Storage) | All queries must preserve RLS |
| Vector store | Qdrant | All searches must filter by `workspace_id` |
| AI | Gemini + Voyage | Provider switching is env-controlled |
| Background jobs | Inngest | All async work goes through Inngest |
| Email | Resend | Never hardcode email logic outside `/src/lib/email/` |
| Deployment | Vercel | Never add `INNGEST_DEV=1` to Vercel env vars |

---

## Inviolable Rules

### Security
- Never expose `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `QDRANT_API_KEY`, or `LLAMAPARSE_API_KEY` in any file that could be committed
- Never read, log, or return secrets in API responses
- Never modify `.env` to add production credentials — use Vercel environment variables
- Never set `INNGEST_DEV=1` in any deployed environment
- Always call `assertWorkspaceOperational(workspaceId)` before write operations
- Always scope Supabase queries with `.eq('workspace_id', ...)` — no cross-tenant data access

### Database
- Never drop or alter tables without a SQL migration file in `/sql/`
- Never bypass RLS by using `getSupabaseAdmin()` in client components
- All new tables must have RLS enabled and explicit policies
- Never use raw SQL strings — use the Supabase client query builder

### RAG Pipeline
- Never change the embedding provider without updating Qdrant collection dimensions
- Never remove the `workspace_id` filter from Qdrant vector searches
- Document processing always goes through Inngest `document/process.started` event — never inline

### Frontend
- **The app is a unified DARK theme** (landing + dashboard + platform). See the banner at the top of `DESIGN.md`. `<html>` carries `class="dark"`.
- Canvas: near-black olive `--canvas (#0a0c0b)`; surfaces `--surface (#141816)`; raised `--surface-2 (#1c211e)`; hairline borders `--line (#242a26)`. Text: `--ink`, `--ink-soft`, `--ink-muted`.
- Accent: jade/teal — use the `teal-*` Tailwind scale and `--accent-jade*` tokens. Do NOT use `cyan-*`. NEVER hardcode light surfaces (`bg-white`, `bg-slate-50`, `text-slate-700`); always use the tokens so the theme stays consistent.
- Both sidebars are dark (`--brand-sidebar #070908`) with translucent-jade active states.
- **One title per page:** the body owns the H1 (`AppPageHeader`/`PlatformPageHeader`); the top bar is a quiet breadcrumb — never repeat the page title there.
- Logo is the inline-SVG `RekallMark`/`BrandLogo` (no raster asset); favicon `public/brand/rekall-icon.svg`.
- Prefer the shared classes (`admin-shell-card`, `app-button-*`, `admin-input`) — they already encode the dark tokens.
- Prefer the centralized API client `src/lib/api-client.ts` (`apiFetch`) for new frontend data calls; it attaches the Supabase token and refreshes on 401.
- Never use `dangerouslySetInnerHTML` except in `app/layout.tsx` JSON-LD (already approved)

---

## After Making Code Changes

Run these checks before reporting work complete:

```bash
# TypeScript check — must pass with 0 errors
npx tsc --noEmit

# Build check — must complete without errors
npm run build

# Lint
npm run lint
```

If either `tsc` or `build` fails, fix the errors before finishing.

---

## Multi-Tenant Architecture Invariants

Rekall-IQ is a multi-tenant SaaS. Every feature must respect these boundaries:

1. **Workspace isolation**: users can only see data from their own `workspace_id`
2. **Role hierarchy**: `platform_admin > tenant_admin > viewer`
3. **Operational checks**: suspended/expired/deleted workspaces cannot perform write operations
4. **Platform admin separation**: `/platform/*` routes are for `platform_admin` only
5. **Inngest event data**: always includes `workspaceId` for tenant-scoped operations

When in doubt about whether a query respects tenant isolation, ask before implementing.

---

## Project Memory

The auto-memory system is active at:
`~/.claude/projects/-home-water-Downloads-springvox-knowledge-ai/memory/`

Memory files track: user preferences, feedback on past decisions, project context, and references.
Read the `MEMORY.md` index at the start of sessions involving remembered context.

---

## External Claude Tools

Installed in `.claude/` — active in every session automatically.

### Superpowers (`.claude/skills/`)
Workflow skills for disciplined development. Use them:
- **Before any new feature:** `/brainstorming` → `/writing-plans` → `/executing-plans`
- **Before touching code:** `/test-driven-development`
- **After code is written:** `/requesting-code-review` → `/receiving-code-review`
- **Before closing a branch:** `/verification-before-completion` → `/finishing-a-development-branch`
- **When a bug appears:** `/systematic-debugging`
- **For parallel work:** `/dispatching-parallel-agents`

### UI UX Pro Max (`.claude/skills/ui-ux-pro-max/`, `ui-styling/`, `design-system/`)
Design intelligence for Tailwind + shadcn UI. Activate it by asking for UI work — it loads automatically when building components, pages, or reviewing design.
**Constraint:** Always defers to `DESIGN.md`. Never suggests Chakra UI, MUI, or other frameworks.

### ECC Rules (`.claude/rules/ecc/`)
TypeScript and common coding guidelines. Loaded as reference for:
- Coding style, immutability, KISS/DRY/YAGNI principles
- TypeScript type patterns, API response shapes
- Security checklist, testing patterns (AAA), TDD cycle
- Git workflow and commit message conventions

**Note:** ECC rules reference "tdd-guide", "planner", and "code-reviewer" agents which are NOT installed — Superpowers skills cover those workflows instead.

---

## What's Currently In Progress

See `docs/beta-readiness-checklist.md` for launch blockers.
See `docs/security_report.md` for the security remediation roadmap (score: 58/100 → target 100/100).

Key open items from the last grand audit (2026-05-31):
- Rotate ALL credentials (Supabase service role, Gemini, Qdrant, LlamaParse)
- Set `NEXT_PUBLIC_APP_URL` in Vercel (invitation + trial emails broken without it)
- Add security headers to `vercel.json`
- Fix privilege escalation in `/api/users/role` (tenant_admin can demote platform_admin)
- Fix rate limiter to use atomic SQL upsert
- Migrate `xlsx` → `exceljs` (HIGH CVE, no upstream fix)
