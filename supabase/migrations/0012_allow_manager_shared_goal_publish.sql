drop policy if exists "owners or admins publish shared goals" on public.goals;

create policy "owners admins managers publish shared goals" on public.goals
for insert
with check (
  organization_id = private.current_org_id()
  and (
    owner_id = (select auth.uid())
    or (
      is_shared = true
      and shared_from_owner_id = (select auth.uid())
      and (
        private.is_admin()
        or private.can_review_profile(owner_id)
      )
    )
  )
);
