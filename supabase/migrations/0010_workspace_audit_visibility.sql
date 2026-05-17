drop policy if exists "audit visible to admins" on public.audit_logs;

create policy "audit visible to org members"
on public.audit_logs
for select
using (organization_id = private.current_org_id());
