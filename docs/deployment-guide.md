# SpringVox Deployment Guide

## Required Services

- Vercel or compatible Next.js host
- Supabase Auth, Postgres, and Storage
- Qdrant
- Inngest
- Voyage AI
- Gemini
- Optional Resend
- Optional LlamaParse

## Deployment Steps

1. Configure environment variables from `.env.example`.
2. Run SQL migrations in README order, including `sql/phase5b_beta_hardening.sql`.
3. Create Supabase Storage bucket `documents`.
4. Verify Qdrant collection dimensions match the embedding provider.
5. Start or deploy Inngest functions.
6. Run `npx tsc --noEmit`.
7. Run `npm run build`.

## Beta Notes

Rate limits and usage metering are Supabase-backed. They are designed for controlled beta protection, not high-volume enterprise abuse prevention.
