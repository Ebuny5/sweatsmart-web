-- Fix the keep_alive function to have immutable search_path
drop function if exists public.keep_alive();

create or replace function public.keep_alive()
returns void
set search_path = public, pg_catalog
language plpgsql
security definer
as $$
begin
  -- Simple operation to keep the database active
  perform 1;
end;
$$;