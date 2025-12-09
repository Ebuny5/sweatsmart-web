-- Fix search_path for update_updated_at_column function (using CASCADE)
drop function if exists public.update_updated_at_column() cascade;

create or replace function public.update_updated_at_column()
returns trigger
set search_path = public, pg_catalog
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Recreate the triggers that depend on this function
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.update_updated_at_column();

create trigger update_user_settings_updated_at
  before update on public.user_settings
  for each row
  execute function public.update_updated_at_column();

create trigger update_episodes_updated_at
  before update on public.episodes
  for each row
  execute function public.update_updated_at_column();

-- Fix search_path for handle_new_user function  
drop function if exists public.handle_new_user() cascade;

create or replace function public.handle_new_user()
returns trigger
set search_path = public, pg_catalog
language plpgsql
security definer
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  
  insert into public.user_settings (user_id)
  values (new.id);
  
  return new;
end;
$$;

-- Recreate the auth trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();