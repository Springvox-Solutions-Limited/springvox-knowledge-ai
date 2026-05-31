# SpringVox Admin Guide

Workspace admins can manage documents, users, analytics, evaluations, and workspace settings.

## Documents

Supported formats: PDF, TXT, DOCX, CSV, XLSX, PPTX.

Admins can upload one or many files from `/dashboard/upload`. Each file is processed asynchronously by Inngest and becomes ready when indexing completes.

## Evaluations

Use `/dashboard/evaluations` to create golden question sets before beta rollout.

Current scoring is deterministic:

- expected document name match
- expected keyword match
- retrieval latency

This is not an LLM judge yet; it is a practical retrieval smoke test.

## Users

Workspace admins can suspend or reactivate users in their workspace. Suspended users cannot access app pages.
