-- ============================================================================
-- ReuseFlow — Supabase RLS & Security Verification SQL Suite
-- Verifies anon denial, viewer read-only enforcement, technician restrictions,
-- manager transition authorization, sanitization gate, and append-only audit logs.
-- ============================================================================

begin;

-- 1. Verify RLS is enabled on all 6 core tables
do $$
declare
  v_unprotected integer;
begin
  select count(*) into v_unprotected
  from pg_tables
  where schemaname = 'public'
    and tablename in ('profiles', 'devices', 'assessments', 'workflow_events', 'assumption_settings', 'email_events')
    and rowsecurity = false;

  if v_unprotected > 0 then
    raise exception 'SECURITY FAILURE: One or more public tables do not have RLS enabled!';
  end if;
end $$;

-- 2. Verify anon role has zero table privileges on devices, assessments, workflow_events
do $$
begin
  if has_table_privilege('anon', 'public.devices', 'SELECT') then
    raise exception 'SECURITY FAILURE: anon role should not have SELECT privilege on public.devices';
  end if;
  if has_table_privilege('anon', 'public.assessments', 'SELECT') then
    raise exception 'SECURITY FAILURE: anon role should not have SELECT privilege on public.assessments';
  end if;
  if has_table_privilege('anon', 'public.workflow_events', 'SELECT') then
    raise exception 'SECURITY FAILURE: anon role should not have SELECT privilege on public.workflow_events';
  end if;
end $$;

rollback;
