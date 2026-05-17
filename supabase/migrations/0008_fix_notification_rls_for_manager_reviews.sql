drop policy if exists "workspace users create notifications for valid recipients" on public.notifications;

create policy "workspace users create notifications for valid recipients"
on public.notifications
for insert
with check (
  organization_id = private.current_org_id()
  and (
    user_id = (select auth.uid())
    or private.is_admin()
    or private.can_review_profile(user_id)
    or private.is_manager_of_current_user(user_id)
  )
);
