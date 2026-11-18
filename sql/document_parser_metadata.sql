-- Add parser metadata columns to public.documents table
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS parser text;

ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS parser_metadata jsonb DEFAULT '{}'::jsonb;

ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS word_count integer;
