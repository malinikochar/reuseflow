-- ============================================================================
-- ReuseFlow — Initial Schema, Constraints, Indexes, Grants & RLS Policies
-- Migration: 20261028000001_initial_schema_and_rls.sql
-- ============================================================================

create extension if not exists "pgcrypto";

-- 1. Domain Enums
do $$ begin
  create type public.user_role as enum ('manager', 'technician', 'viewer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.device_category as enum ('laptop', 'desktop', 'tablet');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.device_condition as enum ('good', 'fair', 'poor', 'unknown');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.battery_safety as enum ('normal', 'degraded', 'swollen', 'unknown', 'not_applicable');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.sanitization_status as enum ('pending', 'verified', 'not_applicable');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.decision_outcome as enum (
    'QUARANTINE',
    'INSUFFICIENT_DATA',
    'REFURBISH_CANDIDATE',
    'RECYCLE_REVIEW',
    'REVIEW_REQUIRED'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.workflow_status as enum (
    'intake',
    'assessed',
    'approved_refurb',
    'repairing',
    'ready',
    'recycle_review',
    'quarantined',
    'closed'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.disposition_type as enum ('distributed', 'recycled', 'other_authorized');
exception when duplicate_object then null; end $$;

-- 2. Tables

-- 2.1 profiles (1:1 with auth.users; role cannot be self-promoted by client)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) >= 2),
  role public.user_role not null default 'viewer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2.2 devices
create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  asset_tag text not null unique check (char_length(trim(asset_tag)) between 3 and 32),
  category public.device_category not null,
  brand text not null check (char_length(trim(brand)) between 1 and 80),
  model text not null check (char_length(trim(model)) between 1 and 120),
  ram_gb integer check (ram_gb is null or (ram_gb >= 0 and ram_gb <= 1024)),
  storage_gb integer check (storage_gb is null or (storage_gb >= 0 and storage_gb <= 32768)),
  boots boolean,
  condition public.device_condition not null default 'unknown',
  battery_safety public.battery_safety not null default 'unknown',
  storage_present boolean not null default true,
  repairable boolean,
  charger_included boolean,
  parts_cost_cents integer check (parts_cost_cents is null or parts_cost_cents >= 0),
  estimated_labor_minutes integer check (estimated_labor_minutes is null or estimated_labor_minutes >= 0),
  comparable_value_cents integer check (comparable_value_cents is null or comparable_value_cents >= 0),
  sanitization_status public.sanitization_status not null default 'pending',
  sanitization_verified_by uuid references public.profiles(id),
  sanitization_verified_at timestamptz,
  sanitization_note text,
  status public.workflow_status not null default 'intake',
  disposition public.disposition_type,
  disposition_note text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Guardrail constraints:
  -- 1) Storage-bearing devices cannot reach ready or closed without verified external sanitization
  constraint devices_sanitization_gate_check check (
    not (storage_present = true and sanitization_status <> 'verified' and status in ('ready', 'closed'))
  ),
  -- 2) Swollen battery hazard cannot be approved_refurb, repairing, or ready
  constraint devices_battery_safety_gate_check check (
    not (battery_safety = 'swollen' and status in ('approved_refurb', 'repairing', 'ready'))
  ),
  -- 3) Closed devices must have a recorded disposition
  constraint devices_closed_disposition_check check (
    not (status = 'closed' and disposition is null)
  )
);

-- 2.3 assessments (Immutable, append-only snapshots)
create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id) on delete cascade,
  input_snapshot jsonb not null,
  config_snapshot jsonb not null,
  decision public.decision_outcome not null,
  rule_version text not null default '1.0.0',
  reason_codes jsonb not null default '[]'::jsonb,
  reason_details jsonb not null default '[]'::jsonb,
  missing_fields jsonb not null default '[]'::jsonb,
  cost_breakdown jsonb,
  repair_cost_cents integer check (repair_cost_cents is null or repair_cost_cents >= 0),
  margin_cents integer,
  sanitization_gate_open boolean not null default false,
  assessed_by uuid not null references public.profiles(id),
  assessed_by_name text not null default 'Staff Member',
  created_at timestamptz not null default now()
);

-- 2.4 workflow_events (Immutable, append-only audit trail)
create table if not exists public.workflow_events (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id) on delete cascade,
  from_status public.workflow_status,
  to_status public.workflow_status not null,
  actor_id uuid not null references public.profiles(id),
  actor_name text not null default 'Staff Member',
  actor_role public.user_role not null,
  note text not null check (char_length(trim(note)) >= 3),
  created_at timestamptz not null default now()
);

-- 2.5 assumption_settings (Singleton row id = 1 for configurable engine assumptions)
create table if not exists public.assumption_settings (
  id integer primary key default 1 check (id = 1),
  rule_version text not null default '1.0.0',
  hourly_rate_cents integer not null default 2000 check (hourly_rate_cents >= 0),
  min_margin_cents integer not null default 2000,
  min_laptop_ram_gb integer not null default 8 check (min_laptop_ram_gb >= 1),
  overhead_cents integer not null default 0 check (overhead_cents >= 0),
  baseline_minutes integer not null default 12 check (baseline_minutes >= 1),
  target_minutes integer not null default 6 check (target_minutes >= 1),
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

insert into public.assumption_settings (
  id, rule_version, hourly_rate_cents, min_margin_cents, min_laptop_ram_gb, overhead_cents, baseline_minutes, target_minutes
) values (1, '1.0.0', 2000, 2000, 8, 0, 12, 6)
on conflict (id) do nothing;

-- 2.6 email_events (P1 manager-only operational summary log; zero PII)
create table if not exists public.email_events (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'operational_summary',
  recipient text not null,
  provider_id text,
  idempotency_key text not null unique,
  status text not null check (status in ('sent', 'failed', 'skipped')),
  sent_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

-- 3. Performance & Policy Indexes (ReuseFlow_PRD.md §8.2)
create index if not exists idx_devices_status on public.devices(status);
create index if not exists idx_devices_category on public.devices(category);
create index if not exists idx_devices_created_at_desc on public.devices(created_at desc);
create index if not exists idx_assessments_device_created_desc on public.assessments(device_id, created_at desc);
create index if not exists idx_workflow_events_device_created_desc on public.workflow_events(device_id, created_at desc);
create index if not exists idx_profiles_role on public.profiles(role);

-- 4. Non-recursive Role Lookup Helper
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select role from public.profiles where id = auth.uid();
$$;

revoke all on function public.current_user_role() from public, anon;
grant execute on function public.current_user_role() to authenticated;

-- 5. Prevent Self-Role Promotion Trigger on profiles
create or replace function public.prevent_role_self_promotion()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.role is distinct from old.role and current_setting('role', true) = 'authenticated' then
    raise exception 'FORBIDDEN: Users cannot modify their own role.';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_prevent_role_self_promotion on public.profiles;
create trigger trg_prevent_role_self_promotion
before update on public.profiles
for each row execute function public.prevent_role_self_promotion();

-- 6. Prevent Mutation/Deletion of Append-Only Tables (assessments, workflow_events)
create or replace function public.prevent_append_only_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'FORBIDDEN: Table % is append-only and immutable.', tg_table_name;
end;
$$;

drop trigger if exists trg_assessments_immutable on public.assessments;
create trigger trg_assessments_immutable
before update or delete on public.assessments
for each row execute function public.prevent_append_only_mutation();

drop trigger if exists trg_workflow_events_immutable on public.workflow_events;
create trigger trg_workflow_events_immutable
before update or delete on public.workflow_events
for each row execute function public.prevent_append_only_mutation();

-- 7. Transactional Server-Side Workflow Transition RPC
create or replace function public.transition_device_status(
  p_device_id uuid,
  p_expected_status public.workflow_status,
  p_next_status public.workflow_status,
  p_note text,
  p_disposition public.disposition_type default null
)
returns public.workflow_events
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_role public.user_role;
  v_actor_name text;
  v_device public.devices%rowtype;
  v_event public.workflow_events%rowtype;
begin
  if v_actor_id is null then
    raise exception 'UNAUTHORIZED: Authentication required.';
  end if;

  select role, display_name into v_actor_role, v_actor_name
  from public.profiles
  where id = v_actor_id;

  if v_actor_role is null or v_actor_role = 'viewer' then
    raise exception 'FORBIDDEN: Role % cannot transition devices.', coalesce(v_actor_role::text, 'none');
  end if;

  if p_note is null or char_length(trim(p_note)) < 3 then
    raise exception 'VALIDATION: Audit note of at least 3 characters is required.';
  end if;

  select * into v_device
  from public.devices
  where id = p_device_id
  for update;

  if not found then
    raise exception 'VALIDATION: Device not found.';
  end if;

  if v_device.status <> p_expected_status then
    raise exception 'CONFLICT: Expected status %, but device is currently %.', p_expected_status, v_device.status;
  end if;

  -- Manager-only transitions
  if (
    v_device.status = 'quarantined' or
    p_next_status in ('approved_refurb', 'recycle_review', 'ready', 'closed')
  ) and v_actor_role <> 'manager' then
    raise exception 'FORBIDDEN: Transition to % requires manager role.', p_next_status;
  end if;

  -- Safety gate
  if v_device.battery_safety = 'swollen' and p_next_status in ('approved_refurb', 'repairing', 'ready') then
    raise exception 'VALIDATION: Safety gate locked due to swollen battery.';
  end if;

  -- Sanitization gate
  if v_device.storage_present = true and v_device.sanitization_status <> 'verified' and p_next_status in ('ready', 'closed') then
    raise exception 'VALIDATION: Data sanitization gate locked until external sanitization is verified.';
  end if;

  if p_next_status = 'closed' and p_disposition is null then
    raise exception 'VALIDATION: Closing a device requires a disposition.';
  end if;

  update public.devices
  set
    status = p_next_status,
    disposition = case when p_next_status = 'closed' then p_disposition else disposition end,
    disposition_note = case when p_next_status = 'closed' then trim(p_note) else disposition_note end,
    updated_at = now()
  where id = p_device_id;

  insert into public.workflow_events (
    device_id, from_status, to_status, actor_id, actor_name, actor_role, note
  ) values (
    p_device_id, v_device.status, p_next_status, v_actor_id, v_actor_name, v_actor_role, trim(p_note)
  )
  returning * into v_event;

  return v_event;
end;
$$;

revoke all on function public.transition_device_status(uuid, public.workflow_status, public.workflow_status, text, public.disposition_type) from public, anon;
grant execute on function public.transition_device_status(uuid, public.workflow_status, public.workflow_status, text, public.disposition_type) to authenticated;

-- 8. Strict Table Grants & Row Level Security (RLS)
revoke all on public.profiles from anon;
revoke all on public.devices from anon;
revoke all on public.assessments from anon;
revoke all on public.workflow_events from anon;
revoke all on public.assumption_settings from anon;
revoke all on public.email_events from anon;

grant select, update (display_name) on public.profiles to authenticated;
grant select, insert, update on public.devices to authenticated;
grant select, insert on public.assessments to authenticated;
grant select, insert on public.workflow_events to authenticated;
grant select, update on public.assumption_settings to authenticated;
grant select, insert on public.email_events to authenticated;

alter table public.profiles enable row level security;
alter table public.devices enable row level security;
alter table public.assessments enable row level security;
alter table public.workflow_events enable row level security;
alter table public.assumption_settings enable row level security;
alter table public.email_events enable row level security;

-- 8.1 profiles policies
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (public.current_user_role() in ('viewer', 'technician', 'manager'));

create policy "profiles_update_own_display_name"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = public.current_user_role());

-- 8.2 devices policies
create policy "devices_select_staff"
  on public.devices for select
  to authenticated
  using (public.current_user_role() in ('viewer', 'technician', 'manager'));

create policy "devices_insert_tech_or_manager"
  on public.devices for insert
  to authenticated
  with check (
    public.current_user_role() in ('technician', 'manager')
    and created_by = auth.uid()
    and status in ('intake', 'assessed', 'quarantined')
  );

create policy "devices_update_technician_intake_only"
  on public.devices for update
  to authenticated
  using (
    public.current_user_role() = 'technician'
    and status in ('intake', 'assessed')
  )
  with check (
    public.current_user_role() = 'technician'
    and status in ('intake', 'assessed', 'quarantined')
  );

create policy "devices_update_manager_all"
  on public.devices for update
  to authenticated
  using (public.current_user_role() = 'manager')
  with check (public.current_user_role() = 'manager');

-- 8.3 assessments policies (Append-only: SELECT + INSERT only)
create policy "assessments_select_staff"
  on public.assessments for select
  to authenticated
  using (public.current_user_role() in ('viewer', 'technician', 'manager'));

create policy "assessments_insert_tech_or_manager"
  on public.assessments for insert
  to authenticated
  with check (
    public.current_user_role() in ('technician', 'manager')
    and assessed_by = auth.uid()
  );

-- 8.4 workflow_events policies (Append-only: SELECT + INSERT only)
create policy "workflow_events_select_staff"
  on public.workflow_events for select
  to authenticated
  using (public.current_user_role() in ('viewer', 'technician', 'manager'));

create policy "workflow_events_insert_tech_or_manager"
  on public.workflow_events for insert
  to authenticated
  with check (
    public.current_user_role() in ('technician', 'manager')
    and actor_id = auth.uid()
    and actor_role = public.current_user_role()
  );

-- 8.5 assumption_settings policies
create policy "assumption_settings_select_staff"
  on public.assumption_settings for select
  to authenticated
  using (public.current_user_role() in ('viewer', 'technician', 'manager'));

create policy "assumption_settings_update_manager_only"
  on public.assumption_settings for update
  to authenticated
  using (public.current_user_role() = 'manager')
  with check (public.current_user_role() = 'manager');

-- 8.6 email_events policies (Manager only)
create policy "email_events_select_manager_only"
  on public.email_events for select
  to authenticated
  using (public.current_user_role() = 'manager');

create policy "email_events_insert_manager_only"
  on public.email_events for insert
  to authenticated
  with check (
    public.current_user_role() = 'manager'
    and sent_by = auth.uid()
  );
