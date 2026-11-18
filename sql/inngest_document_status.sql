ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'processing';

ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS error_message text;

-- Drop the old check constraint if it exists to ensure we can recreate it with new allowed statuses
ALTER TABLE public.documents
DROP CONSTRAINT IF EXISTS documents_status_check;

-- Backfill all completed/complete statuses to 'ready' to satisfy the new constraint
UPDATE public.documents
SET status = 'ready'
WHERE status = 'completed' OR status = 'complete' OR status IS NULL;

-- Recreate the check constraint to strictly enforce: 'processing', 'ready', 'failed'
ALTER TABLE public.documents
ADD CONSTRAINT documents_status_check
CHECK (status IN ('processing', 'ready', 'failed'));
