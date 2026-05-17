drop policy if exists "users update own profile or admins update org" on public.profiles;

create policy "users update own profile or admins update org" on public.profiles
for update
using (
  organization_id = private.current_org_id()
  and (
    id = (select auth.uid())
    or private.is_admin()
  )
)
with check (
  organization_id = private.current_org_id()
  and (
    id = (select auth.uid())
    or private.is_admin()
  )
);
