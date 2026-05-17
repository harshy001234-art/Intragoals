create or replace function private.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(private.current_role() = 'admin', false)
$$;
