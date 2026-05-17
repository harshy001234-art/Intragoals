drop policy if exists "owners create goals" on public.goals;

create policy "owners or admins publish shared goals" on public.goals
for insert
with check (
  organization_id = private.current_org_id()
  and (
    owner_id = (select auth.uid())
    or (
      private.is_admin()
      and is_shared = true
      and shared_from_owner_id = (select auth.uid())
    )
  )
);
