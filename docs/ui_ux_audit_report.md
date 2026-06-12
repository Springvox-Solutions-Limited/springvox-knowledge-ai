# SpringVox Knowledge AI — Full UI/UX Audit Report
**Date:** 2026-05-31  
**Auditor:** Claude (with UI UX Pro Max + DESIGN.md constraints)  
**Scope:** All 25+ screens across public, dashboard, and platform admin  
**Note:** Supersedes May 18 comparative audit.

---

## Executive Summary

The SpringVox UI is in a **good but uneven state**. The core design language is strong: navy sidebar + white cards + cyan/teal accents + Inter typography. Most high-traffic pages (chat, documents, users, analytics) are polished. Three critical areas need work before beta launch:

1. **Evaluations page** — completely raw HTML, no design system, no error handling
2. **Loading states** — inconsistent across pages
3. **AuthForm register dead code** — `mode="register"` uses `alert()` and bypasses workspace creation

---

## Screen Inventory

| Screen | Route | Quality | Key Issue |
|--------|-------|---------|-----------|
| Landing page | `/` | 🟢 Good | — |
| Login | `/login` | 🟡 Fair | No forgot password, label accessibility |
| Register / Onboarding | `/register` | 🟢 Good | — |
| Billing required | `/billing-required` | 🟡 Fair | Minimal but functional |
| Dashboard overview | `/dashboard` | 🟢 Good | Minor stat duplication with analytics |
| Chat | `/dashboard/chat` | 🟢 Excellent | Best page in the app |
| Documents | `/dashboard/documents` | 🟢 Good | Over-fetches with select("*") |
| Upload | `/dashboard/upload` | 🟢 Good | KPI cards use raw divs not StatCard |
| Analytics | `/dashboard/analytics` | 🟢 Good | — |
| Users | `/dashboard/users` | 🟢 Good | KPI cards use raw divs not StatCard |
| Knowledge Gaps | `/dashboard/knowledge-gaps` | 🟡 Fair | Raw \<select\> not shadcn Select |
| Notifications | `/dashboard/notifications` | 🟢 Good | — |
| Settings | `/dashboard/settings` | 🟢 Good | — |
| **Evaluations** | `/dashboard/evaluations` | 🔴 Poor | Raw inputs, no loading/empty states |
| Platform Overview | `/platform` | 🟢 Good | — |
| Companies | `/platform/companies` | 🟢 Good | — |
| Users | `/platform/users` | 🟢 Good | Workspace column duplicated |
| Workspaces | `/platform/workspaces` | 🟡 Fair | Overlaps Companies page visually |
| **Diagnostics** | `/platform/diagnostics` | 🟡 Fair | No severity color coding |
| **Plans** | `/platform/plans` | 🟡 Fair | Placeholder ("billing not enabled") |

---

## Critical Issues Found

### 1. Evaluations Page — Biggest UX Debt
Raw `<input>` and `<select>` elements bypass the entire design system. No loading state, no skeleton, no error display, no empty state, no toast feedback. Uses a plain `<p>` for success messages. Eval runs show no progress.

### 2. AuthForm Dead Register Code
`mode="register"` in `AuthForm.tsx` is never triggered (register page uses `WorkspaceOnboardingForm`). The dead code calls `supabase.auth.signUp()` directly — bypassing workspace creation — and uses `alert()` for feedback. **Fix: remove it.**

### 3. Dashboard Layout Auth Re-fetch
`useEffect([pathname, router])` re-runs the full auth load on every dashboard navigation. Causes flashes and unnecessary API calls. **Fix: remove `pathname` from deps.**

---

## Design Inconsistencies

| Issue | Affected Pages |
|-------|---------------|
| Raw `<select>` instead of shadcn Select | Knowledge Gaps, Evaluations |
| KPI cards using raw divs instead of StatCard | Users, Upload |
| No severity color coding | Platform Diagnostics |
| Both Companies and Workspaces use Building2 icon | Platform sidebar |
| Loading state inconsistency (spinner vs skeleton vs text) | Analytics, Users, Knowledge Gaps, Evaluations |
| AuthForm labels have no `htmlFor` attribute | Login page |

---

## What's NOT Being Changed

The following are working well and will not be touched:
- Chat interface (SSE streaming, citations, voice, follow-ups)
- Dashboard overview layout
- Documents table + mobile cards
- Upload multi-file queue
- Users page CRUD
- Settings live preview
- Analytics charts
- All AppButton, AppTable, AppCard, EmptyState components
- Navigation structure and role-based routing
- Platform companies table

---

## Changes Implemented (see below for details)

| Change | File |
|--------|------|
| Remove AuthForm dead register code + fix label accessibility | `src/components/AuthForm.tsx` |
| Fix dashboard layout auth re-fetch | `app/dashboard/layout.tsx` |
| Fix knowledge gaps raw select | `app/dashboard/knowledge-gaps/page.tsx` |
| Redesign evaluations page | `app/dashboard/evaluations/page.tsx` |
| Add severity badges to diagnostics | `app/platform/diagnostics/page.tsx` |
| Fix duplicate Building2 icon in platform nav | `app/platform/layout.tsx` |
| Replace raw KPI divs with StatCard in Users page | `app/dashboard/users/page.tsx` |
| Replace raw KPI divs with StatCard in Upload page | `app/dashboard/upload/page.tsx` |
| Add SkeletonCard shared component | `src/components/ui/skeleton-card.tsx` |
| Apply skeleton loading to Analytics page | `app/dashboard/analytics/page.tsx` |

