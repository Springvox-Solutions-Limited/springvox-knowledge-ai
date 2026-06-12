# Rekall-IQ Security Guide

## Core Controls

- Supabase Auth validates users.
- RLS protects tenant-facing tables.
- Server APIs use workspace-aware authorization.
- Qdrant filters include `workspace_id`.
- Uploads validate file extension, MIME type, and size.
- LlamaParse is disabled by default.
- Detailed RAG logs require `RAG_DEBUG=true`.

## Rate Limits

Beta rate limits protect chat, upload, signup, platform APIs, notifications, and document deletion. Responses use HTTP 429 with safe retry headers.

## Secrets

Never expose service role keys, Voyage keys, Gemini keys, Resend keys, or LlamaParse keys through `NEXT_PUBLIC`.

## Manual Supabase Action

Enable leaked password protection:

Supabase Dashboard -> Authentication -> Password Security -> Enable leaked password protection.
