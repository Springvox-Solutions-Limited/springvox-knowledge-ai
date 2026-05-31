alter table public.documents
  add column if not exists document_summary text,
  add column if not exists document_keywords text[] not null default '{}',
  add column if not exists document_category text not null default 'Other';

alter table public.document_chunks
  add column if not exists table_metadata jsonb not null default '{}'::jsonb;

create index if not exists documents_workspace_category_idx
  on public.documents (workspace_id, document_category);

create index if not exists documents_keywords_gin_idx
  on public.documents using gin (document_keywords);

notify pgrst, 'reload schema';
