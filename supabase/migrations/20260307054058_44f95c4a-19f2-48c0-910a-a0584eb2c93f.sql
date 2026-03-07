ALTER TABLE public.episodes 
  ALTER COLUMN date TYPE timestamptz 
  USING date::timestamptz;