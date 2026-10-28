-- ============================================================================
-- ReuseFlow — Per-User Account Isolation, Extended Profiles & Password Recovery
-- Migration: 20261029000001_user_accounts_and_auth_flows.sql
-- ============================================================================

-- 1. Extended User Profile Columns on public.profiles
alter table public.profiles add column if not exists phone text not null default '';
alter table public.profiles add column if not exists location text not null default 'Main Refurbishment Bench';
alter table public.profiles add column if not exists bio text not null default '';

grant select, update (display_name, department, job_title, phone, location, bio) on public.profiles to authenticated;

-- 2. Per-User Engine & Scenario Lab Settings (public.user_settings)
create table if not exists public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  rule_version text not null default '1.0.0',
  hourly_rate_cents integer not null default 2000 check (hourly_rate_cents >= 0),
  min_margin_cents integer not null default 2000,
  min_laptop_ram_gb integer not null default 8 check (min_laptop_ram_gb >= 1),
  overhead_cents integer not null default 0 check (overhead_cents >= 0),
  baseline_minutes integer not null default 12 check (baseline_minutes >= 1),
  target_minutes integer not null default 6 check (target_minutes >= 1),
  updated_at timestamptz not null default now()
);

revoke all on public.user_settings from anon;
grant select, insert, update on public.user_settings to authenticated;
alter table public.user_settings enable row level security;

drop policy if exists "user_settings_own_account" on public.user_settings;
create policy "user_settings_own_account"
  on public.user_settings for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 3. Per-User Separate Account Scoping on public.devices
-- Replace global asset_tag unique constraint with per-user (created_by, asset_tag) unique constraint
alter table public.devices drop constraint if exists devices_asset_tag_key;

do $$ begin
  alter table public.devices
    add constraint devices_created_by_asset_tag_key unique (created_by, asset_tag);
exception when duplicate_table or duplicate_object then null; end $$;

create index if not exists idx_devices_created_by on public.devices(created_by);

-- 4. Automatic Per-User Workspace Provisioning RPC
create or replace function public.ensure_user_workspace_seeded(p_user_id uuid default auth.uid())
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := coalesce(p_user_id, auth.uid());
  v_display_name text;
  v_role public.user_role;
  v_device_count integer;
  v_d1 uuid := gen_random_uuid();
  v_d2 uuid := gen_random_uuid();
  v_d3 uuid := gen_random_uuid();
  v_d4 uuid := gen_random_uuid();
  v_d5 uuid := gen_random_uuid();
  v_d6 uuid := gen_random_uuid();
begin
  if v_uid is null then
    return;
  end if;

  select display_name, role into v_display_name, v_role
  from public.profiles
  where id = v_uid;

  if not found then
    return;
  end if;

  -- Provision per-user engine & scenario settings
  insert into public.user_settings (
    user_id, rule_version, hourly_rate_cents, min_margin_cents, min_laptop_ram_gb, overhead_cents, baseline_minutes, target_minutes
  ) values (
    v_uid, '1.0.0', 2000, 2000, 8, 0, 12, 6
  ) on conflict (user_id) do nothing;

  select count(*) into v_device_count
  from public.devices
  where created_by = v_uid;

  if v_device_count > 0 then
    return;
  end if;

  -- Provision isolated starter devices for this user's account
  insert into public.devices (
    id, asset_tag, category, brand, model, ram_gb, storage_gb, boots, condition,
    battery_safety, storage_present, repairable, charger_included,
    parts_cost_cents, estimated_labor_minutes, comparable_value_cents,
    sanitization_status, sanitization_verified_by, sanitization_verified_at, sanitization_note,
    status, created_by, created_at, updated_at
  ) values
  (
    v_d1, 'FG-DEMO-101', 'laptop', 'Lenovo', 'ThinkPad T480 (Sample)',
    8, 256, true, 'good', 'normal', true, true, true,
    2000, 45, 18000,
    'verified', v_uid, '2026-10-28T09:27:00Z', 'External NIST 800-88 clear verified on bench #2 (Ref: SAN-2026-101).',
    'approved_refurb', v_uid, '2026-10-28T09:15:00Z', '2026-10-28T09:30:00Z'
  ),
  (
    v_d2, 'FG-DEMO-102', 'laptop', 'Dell', 'Latitude E5450 (Sample)',
    4, 128, true, 'fair', 'normal', true, true, false,
    4000, 90, 7000,
    'pending', null, null, null,
    'assessed', v_uid, '2026-10-28T10:05:00Z', '2026-10-28T10:10:00Z'
  ),
  (
    v_d3, 'FG-DEMO-103', 'laptop', 'HP', 'EliteBook 840 G5 (Sample)',
    16, 512, true, 'fair', 'swollen', true, true, true,
    3500, 30, 24000,
    'pending', null, null, null,
    'quarantined', v_uid, '2026-10-28T10:40:00Z', '2026-10-28T10:45:00Z'
  ),
  (
    v_d4, 'FG-DEMO-104', 'desktop', 'HP', 'ProDesk 600 G2 SFF (Sample)',
    8, null, false, 'poor', 'not_applicable', false, false, true,
    20000, 60, 8000,
    'not_applicable', null, null, 'No drive caddies or non-volatile storage media installed at intake.',
    'recycle_review', v_uid, '2026-10-28T11:20:00Z', '2026-10-28T11:35:00Z'
  ),
  (
    v_d5, 'FG-DEMO-105', 'tablet', 'Apple', 'iPad 7th Gen 32GB (Sample)',
    3, 32, true, 'good', 'normal', true, true, false,
    1500, 20, null,
    'pending', null, null, null,
    'intake', v_uid, '2026-10-28T12:10:00Z', '2026-10-28T12:10:00Z'
  ),
  (
    v_d6, 'FG-DEMO-106', 'desktop', 'Dell', 'OptiPlex 7060 Micro (Sample)',
    16, 512, true, 'good', 'not_applicable', true, true, true,
    1500, 30, 14000,
    'pending', null, null, null,
    'repairing', v_uid, '2026-10-28T13:00:00Z', '2026-10-28T13:25:00Z'
  );

  insert into public.assessments (
    device_id, input_snapshot, config_snapshot, decision, rule_version,
    reason_codes, reason_details, missing_fields, cost_breakdown,
    repair_cost_cents, margin_cents, sanitization_gate_open,
    assessed_by, assessed_by_name, created_at
  ) values
  (
    v_d1,
    '{"category":"laptop","brand":"Lenovo","model":"ThinkPad T480 (Sample)","ramGb":8,"storageGb":256,"boots":true,"condition":"good","batterySafety":"normal","storagePresent":true,"repairable":true,"chargerIncluded":true,"partsCostCents":2000,"estimatedLaborMinutes":45,"comparableValueCents":18000}'::jsonb,
    '{"ruleVersion":"1.0.0","hourlyRateCents":2000,"minMarginCents":2000,"minLaptopRamGb":8,"overheadCents":0,"baselineMinutes":12,"targetMinutes":6}'::jsonb,
    'REFURBISH_CANDIDATE', '1.0.0',
    '["VIABLE_COST_AND_FUNCTION"]'::jsonb,
    '["Device boots, is repairable, meets the 8 GB RAM baseline, and yields an estimated net margin of $145.00 (>= $20.00 threshold)."]'::jsonb,
    '[]'::jsonb,
    '{"partsCostCents":2000,"laborCostCents":1500,"overheadCents":0,"totalRepairCostCents":3500,"comparableValueCents":18000,"marginCents":14500,"hourlyRateCents":2000,"estimatedLaborMinutes":45}'::jsonb,
    3500, 14500, true,
    v_uid, v_display_name, '2026-10-28T09:15:00Z'
  ),
  (
    v_d2,
    '{"category":"laptop","brand":"Dell","model":"Latitude E5450 (Sample)","ramGb":4,"storageGb":128,"boots":true,"condition":"fair","batterySafety":"normal","storagePresent":true,"repairable":true,"chargerIncluded":false,"partsCostCents":4000,"estimatedLaborMinutes":90,"comparableValueCents":7000}'::jsonb,
    '{"ruleVersion":"1.0.0","hourlyRateCents":2000,"minMarginCents":2000,"minLaptopRamGb":8,"overheadCents":0,"baselineMinutes":12,"targetMinutes":6}'::jsonb,
    'REVIEW_REQUIRED', '1.0.0',
    '["BELOW_MARGIN_THRESHOLD","LOW_RAM","SANITIZATION_GATE_PENDING"]'::jsonb,
    '["Estimated net margin ($0.00) is below the $20.00 refurbishment threshold.","Laptop RAM (4 GB) is below the 8 GB minimum heuristic.","Storage sanitization verification is pending."]'::jsonb,
    '[]'::jsonb,
    '{"partsCostCents":4000,"laborCostCents":3000,"overheadCents":0,"totalRepairCostCents":7000,"comparableValueCents":7000,"marginCents":0,"hourlyRateCents":2000,"estimatedLaborMinutes":90}'::jsonb,
    7000, 0, false,
    v_uid, v_display_name, '2026-10-28T10:05:00Z'
  ),
  (
    v_d3,
    '{"category":"laptop","brand":"HP","model":"EliteBook 840 G5 (Sample)","ramGb":16,"storageGb":512,"boots":true,"condition":"fair","batterySafety":"swollen","storagePresent":true,"repairable":true,"chargerIncluded":true,"partsCostCents":3500,"estimatedLaborMinutes":30,"comparableValueCents":24000}'::jsonb,
    '{"ruleVersion":"1.0.0","hourlyRateCents":2000,"minMarginCents":2000,"minLaptopRamGb":8,"overheadCents":0,"baselineMinutes":12,"targetMinutes":6}'::jsonb,
    'QUARANTINE', '1.0.0',
    '["SAFETY_BATTERY_SWOLLEN","SANITIZATION_GATE_PENDING"]'::jsonb,
    '["Swollen battery hazard requires immediate safety quarantine and isolation before any refurbishment work.","Storage sanitization verification is pending."]'::jsonb,
    '[]'::jsonb,
    '{"partsCostCents":3500,"laborCostCents":1000,"overheadCents":0,"totalRepairCostCents":4500,"comparableValueCents":24000,"marginCents":19500,"hourlyRateCents":2000,"estimatedLaborMinutes":30}'::jsonb,
    4500, 19500, false,
    v_uid, v_display_name, '2026-10-28T10:40:00Z'
  ),
  (
    v_d4,
    '{"category":"desktop","brand":"HP","model":"ProDesk 600 G2 SFF (Sample)","ramGb":8,"storageGb":null,"boots":false,"condition":"poor","batterySafety":"not_applicable","storagePresent":false,"repairable":false,"chargerIncluded":true,"partsCostCents":20000,"estimatedLaborMinutes":60,"comparableValueCents":8000}'::jsonb,
    '{"ruleVersion":"1.0.0","hourlyRateCents":2000,"minMarginCents":2000,"minLaptopRamGb":8,"overheadCents":0,"baselineMinutes":12,"targetMinutes":6}'::jsonb,
    'RECYCLE_REVIEW', '1.0.0',
    '["NOT_REPAIRABLE_AND_NEGATIVE_MARGIN","BOOT_FAILURE","POOR_PHYSICAL_CONDITION"]'::jsonb,
    '["Device is marked not repairable and total repair cost ($220.00) exceeds comparable value ($80.00) for a net margin of -$140.00."]'::jsonb,
    '[]'::jsonb,
    '{"partsCostCents":20000,"laborCostCents":2000,"overheadCents":0,"totalRepairCostCents":22000,"comparableValueCents":8000,"marginCents":-14000,"hourlyRateCents":2000,"estimatedLaborMinutes":60}'::jsonb,
    22000, -14000, true,
    v_uid, v_display_name, '2026-10-28T11:20:00Z'
  ),
  (
    v_d5,
    '{"category":"tablet","brand":"Apple","model":"iPad 7th Gen 32GB (Sample)","ramGb":3,"storageGb":32,"boots":true,"condition":"good","batterySafety":"normal","storagePresent":true,"repairable":true,"chargerIncluded":false,"partsCostCents":1500,"estimatedLaborMinutes":20,"comparableValueCents":null}'::jsonb,
    '{"ruleVersion":"1.0.0","hourlyRateCents":2000,"minMarginCents":2000,"minLaptopRamGb":8,"overheadCents":0,"baselineMinutes":12,"targetMinutes":6}'::jsonb,
    'INSUFFICIENT_DATA', '1.0.0',
    '["MISSING_CRITICAL_INPUTS","SANITIZATION_GATE_PENDING"]'::jsonb,
    '["Missing critical intake inputs required for economic evaluation: comparableValueCents.","Storage sanitization verification is pending."]'::jsonb,
    '["comparableValueCents"]'::jsonb,
    null, null, null, false,
    v_uid, v_display_name, '2026-10-28T12:10:00Z'
  ),
  (
    v_d6,
    '{"category":"desktop","brand":"Dell","model":"OptiPlex 7060 Micro (Sample)","ramGb":16,"storageGb":512,"boots":true,"condition":"good","batterySafety":"not_applicable","storagePresent":true,"repairable":true,"chargerIncluded":true,"partsCostCents":1500,"estimatedLaborMinutes":30,"comparableValueCents":14000}'::jsonb,
    '{"ruleVersion":"1.0.0","hourlyRateCents":2000,"minMarginCents":2000,"minLaptopRamGb":8,"overheadCents":0,"baselineMinutes":12,"targetMinutes":6}'::jsonb,
    'REFURBISH_CANDIDATE', '1.0.0',
    '["VIABLE_COST_AND_FUNCTION","SANITIZATION_GATE_PENDING"]'::jsonb,
    '["Estimated net margin ($115.00) meets or exceeds the $20.00 minimum refurbishment margin threshold.","Storage sanitization verification is pending before device can reach ready or closed."]'::jsonb,
    '[]'::jsonb,
    '{"partsCostCents":1500,"laborCostCents":1000,"overheadCents":0,"totalRepairCostCents":2500,"comparableValueCents":14000,"marginCents":11500,"hourlyRateCents":2000,"estimatedLaborMinutes":30}'::jsonb,
    2500, 11500, false,
    v_uid, v_display_name, '2026-10-28T13:00:00Z'
  );

  insert into public.workflow_events (
    device_id, from_status, to_status, actor_id, actor_name, actor_role, note, created_at
  ) values
  (v_d1, null, 'intake', v_uid, v_display_name, v_role, 'Initial intake recorded for Case A — Viable Refurbish Laptop.', '2026-10-28T09:15:00Z'),
  (v_d1, 'intake', 'assessed', v_uid, v_display_name, v_role, 'Deterministic assessment v1.0.0 completed (REFURBISH_CANDIDATE).', '2026-10-28T09:20:00Z'),
  (v_d1, 'assessed', 'approved_refurb', v_uid, v_display_name, v_role, 'Approved refurbishment candidate based on positive net margin ($145.00).', '2026-10-28T09:30:00Z'),
  (v_d2, null, 'intake', v_uid, v_display_name, v_role, 'Initial intake recorded for Case B — Borderline Low-RAM / Low-Margin Laptop.', '2026-10-28T10:05:00Z'),
  (v_d2, 'intake', 'assessed', v_uid, v_display_name, v_role, 'Deterministic assessment v1.0.0 completed (REVIEW_REQUIRED).', '2026-10-28T10:10:00Z'),
  (v_d3, null, 'intake', v_uid, v_display_name, v_role, 'Initial intake recorded for Case C — Swollen Battery Safety Hazard.', '2026-10-28T10:40:00Z'),
  (v_d3, 'intake', 'quarantined', v_uid, v_display_name, v_role, 'Swollen battery detected during intake check; isolated in safety quarantine.', '2026-10-28T10:45:00Z'),
  (v_d4, null, 'intake', v_uid, v_display_name, v_role, 'Initial intake recorded for Case D — Economically Unviable / Irreparable.', '2026-10-28T11:20:00Z'),
  (v_d4, 'intake', 'assessed', v_uid, v_display_name, v_role, 'Deterministic assessment v1.0.0 completed (RECYCLE_REVIEW).', '2026-10-28T11:25:00Z'),
  (v_d4, 'assessed', 'recycle_review', v_uid, v_display_name, v_role, 'Confirmed negative repair margin and non-repairable mainboard; queued for recycle review.', '2026-10-28T11:35:00Z'),
  (v_d5, null, 'intake', v_uid, v_display_name, v_role, 'Initial intake recorded for Case E — Missing Comparable Value Input.', '2026-10-28T12:10:00Z'),
  (v_d6, null, 'intake', v_uid, v_display_name, v_role, 'Initial intake recorded for Case F — Viable Refurbish with Pending Sanitization Gate.', '2026-10-28T13:00:00Z'),
  (v_d6, 'intake', 'assessed', v_uid, v_display_name, v_role, 'Deterministic assessment v1.0.0 completed (REFURBISH_CANDIDATE).', '2026-10-28T13:05:00Z'),
  (v_d6, 'assessed', 'approved_refurb', v_uid, v_display_name, v_role, 'Approved refurbishment candidate based on positive net margin ($115.00).', '2026-10-28T13:15:00Z'),
  (v_d6, 'approved_refurb', 'repairing', v_uid, v_display_name, v_role, 'Bench repair started; awaiting external storage sanitization verification before marking ready.', '2026-10-28T13:25:00Z');
end;
$$;

revoke all on function public.ensure_user_workspace_seeded(uuid) from public, anon;
grant execute on function public.ensure_user_workspace_seeded(uuid) to authenticated;

-- 5. Update handle_new_auth_user Trigger to Provision Profile & Separate User Workspace
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_display_name text;
  v_department text;
  v_job_title text;
  v_phone text;
  v_location text;
  v_bio text;
  v_req_role text;
  v_role public.user_role := 'technician';
begin
  v_display_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
    split_part(coalesce(new.email, 'Staff Member'), '@', 1)
  );
  if char_length(v_display_name) < 2 then
    v_display_name := 'Operations Staff';
  end if;

  v_department := coalesce(
    nullif(trim(new.raw_user_meta_data->>'department'), ''),
    'Refurbishment Operations'
  );
  v_job_title := coalesce(
    nullif(trim(new.raw_user_meta_data->>'job_title'), ''),
    'Refurbishment Specialist'
  );
  v_phone := coalesce(trim(new.raw_user_meta_data->>'phone'), '');
  v_location := coalesce(
    nullif(trim(new.raw_user_meta_data->>'location'), ''),
    'Main Refurbishment Bench'
  );
  v_bio := coalesce(trim(new.raw_user_meta_data->>'bio'), '');

  v_req_role := lower(coalesce(new.raw_user_meta_data->>'role', 'technician'));
  if v_req_role in ('technician', 'viewer') then
    v_role := v_req_role::public.user_role;
  else
    v_role := 'technician'::public.user_role;
  end if;

  insert into public.profiles (id, email, display_name, department, job_title, phone, location, bio, role)
  values (new.id, new.email, v_display_name, v_department, v_job_title, v_phone, v_location, v_bio, v_role)
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = coalesce(nullif(public.profiles.display_name, ''), excluded.display_name),
    updated_at = now();

  perform public.ensure_user_workspace_seeded(new.id);
  return new;
end;
$$;

-- Provision isolated workspaces for all existing user accounts right now
do $$
declare
  r record;
begin
  for r in select id from public.profiles loop
    perform public.ensure_user_workspace_seeded(r.id);
  end loop;
end $$;

-- 6. Update RLS Policies so Each User Account Reads/Manages Its Own Separate Data
drop policy if exists "devices_select_staff" on public.devices;
create policy "devices_select_staff"
  on public.devices for select
  to authenticated
  using (created_by = auth.uid());

drop policy if exists "devices_insert_tech_or_manager" on public.devices;
create policy "devices_insert_tech_or_manager"
  on public.devices for insert
  to authenticated
  with check (
    public.current_user_role() in ('technician', 'manager')
    and created_by = auth.uid()
    and status in ('intake', 'assessed', 'quarantined')
  );

drop policy if exists "devices_update_technician_intake_only" on public.devices;
create policy "devices_update_technician_intake_only"
  on public.devices for update
  to authenticated
  using (
    created_by = auth.uid()
    and public.current_user_role() = 'technician'
  )
  with check (
    created_by = auth.uid()
    and public.current_user_role() = 'technician'
  );

drop policy if exists "devices_update_manager_all" on public.devices;
create policy "devices_update_manager_all"
  on public.devices for update
  to authenticated
  using (
    created_by = auth.uid()
    and public.current_user_role() = 'manager'
  )
  with check (
    created_by = auth.uid()
    and public.current_user_role() = 'manager'
  );

-- 7. Password Recovery (Forgot Password via Email) & Change Password RPCs
create table if not exists public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null default (now() + interval '15 minutes'),
  used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.password_reset_tokens enable row level security;
revoke all on public.password_reset_tokens from public, anon, authenticated;

create or replace function public.issue_password_reset_code(
  p_email text,
  p_code text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions, pg_temp
as $$
declare
  v_clean_email text := lower(trim(coalesce(p_email, '')));
  v_clean_code text := trim(coalesce(p_code, ''));
  v_user_id uuid;
  v_display_name text;
begin
  if v_clean_email = '' or char_length(v_clean_code) < 6 then
    return jsonb_build_object('found', false, 'display_name', '');
  end if;

  select u.id, coalesce(p.display_name, split_part(u.email, '@', 1))
  into v_user_id, v_display_name
  from auth.users u
  left join public.profiles p on p.id = u.id
  where lower(u.email) = v_clean_email
  limit 1;

  if v_user_id is null then
    return jsonb_build_object('found', false, 'display_name', '');
  end if;

  -- Invalidate previous unused codes for this user
  update public.password_reset_tokens
  set used_at = now()
  where user_id = v_user_id and used_at is null;

  insert into public.password_reset_tokens (user_id, email, code_hash, expires_at)
  values (
    v_user_id,
    v_clean_email,
    encode(extensions.digest(v_clean_email || ':' || v_clean_code, 'sha256'), 'hex'),
    now() + interval '15 minutes'
  );

  return jsonb_build_object('found', true, 'display_name', v_display_name);
end;
$$;

revoke all on function public.issue_password_reset_code(text, text) from public;
grant execute on function public.issue_password_reset_code(text, text) to anon, authenticated;

create or replace function public.reset_password_with_code(
  p_email text,
  p_code text,
  p_new_password text
)
returns boolean
language plpgsql
security definer
set search_path = public, auth, extensions, pg_temp
as $$
declare
  v_clean_email text := lower(trim(coalesce(p_email, '')));
  v_clean_code text := trim(coalesce(p_code, ''));
  v_hash text;
  v_token public.password_reset_tokens%rowtype;
begin
  if char_length(coalesce(p_new_password, '')) < 6 then
    raise exception 'VALIDATION: New password must be at least 6 characters.';
  end if;

  v_hash := encode(extensions.digest(v_clean_email || ':' || v_clean_code, 'sha256'), 'hex');

  select * into v_token
  from public.password_reset_tokens
  where email = v_clean_email
    and code_hash = v_hash
    and used_at is null
    and expires_at > now()
  order by created_at desc
  limit 1
  for update;

  if not found then
    raise exception 'INVALID_CODE: Invalid or expired 6-digit recovery code. Please request a new code.';
  end if;

  update public.password_reset_tokens
  set used_at = now()
  where id = v_token.id;

  update auth.users
  set
    encrypted_password = extensions.crypt(p_new_password, extensions.gen_salt('bf', 10)),
    email_confirmed_at = coalesce(email_confirmed_at, now()),
    updated_at = now()
  where id = v_token.user_id;

  return true;
end;
$$;

revoke all on function public.reset_password_with_code(text, text, text) from public;
grant execute on function public.reset_password_with_code(text, text, text) to anon, authenticated;

create or replace function public.change_own_password(
  p_new_password text
)
returns boolean
language plpgsql
security definer
set search_path = public, auth, extensions, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'UNAUTHORIZED: Please sign in to change your password.';
  end if;

  if char_length(coalesce(p_new_password, '')) < 6 then
    raise exception 'VALIDATION: New password must be at least 6 characters.';
  end if;

  update auth.users
  set
    encrypted_password = extensions.crypt(p_new_password, extensions.gen_salt('bf', 10)),
    updated_at = now()
  where id = v_uid;

  return true;
end;
$$;

revoke all on function public.change_own_password(text) from public, anon;
grant execute on function public.change_own_password(text) to authenticated;
