# SpringVox Architecture Guide

## Request Flow

Browser -> Next.js App Router -> Supabase Auth/Profile -> Workspace guard -> Feature API.

## Document Flow

Upload -> Supabase Storage -> Inngest -> parser router -> Voyage embeddings -> Qdrant -> Supabase chunks -> document ready.

## Chat Flow

Question -> Voyage query embedding -> Qdrant + keyword search -> Voyage rerank -> context compression -> answer intelligence -> Gemini streaming -> citations/follow-ups.

## Operational Tables

- `rate_limits`
- `workspace_usage_daily`
- `system_events`
- `rag_eval_*`
- `audit_logs`

These prepare the platform for beta operations and future billing.
