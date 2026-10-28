BEGIN;
    SET LOCAL app.allow_seed_reset = 'true';
    DELETE FROM public.devices WHERE asset_tag IN ('FG-DEMO-101','FG-DEMO-102','FG-DEMO-103','FG-DEMO-104','FG-DEMO-105','FG-DEMO-106');

    INSERT INTO public.devices (
      id, asset_tag, category, brand, model, ram_gb, storage_gb, boots, condition,
      battery_safety, storage_present, repairable, charger_included,
      parts_cost_cents, estimated_labor_minutes, comparable_value_cents,
      sanitization_status, sanitization_verified_by, sanitization_verified_at, sanitization_note,
      status, created_by, created_at, updated_at
    ) VALUES
    (
      '11111111-1111-4111-8111-111111111101', 'FG-DEMO-101', 'laptop', 'Lenovo', 'ThinkPad T480 (Sample)',
      8, 256, true, 'good', 'normal', true, true, true,
      2000, 45, 18000,
      'verified', 'ae4b5f9f-11ae-4b3f-b26e-ba18dda049d8', '2026-10-28T09:27:00Z', 'External NIST 800-88 clear verified on bench #2 (Ref: SAN-2026-101).',
      'approved_refurb', '1e891458-a4cb-45d4-b676-0750e8738d39', '2026-10-28T09:15:00Z', '2026-10-28T09:30:00Z'
    ),
    (
      '11111111-1111-4111-8111-111111111102', 'FG-DEMO-102', 'laptop', 'Dell', 'Latitude E5450 (Sample)',
      4, 128, true, 'fair', 'normal', true, true, false,
      4000, 90, 7000,
      'pending', NULL, NULL, NULL,
      'assessed', '1e891458-a4cb-45d4-b676-0750e8738d39', '2026-10-28T10:05:00Z', '2026-10-28T10:10:00Z'
    ),
    (
      '11111111-1111-4111-8111-111111111103', 'FG-DEMO-103', 'laptop', 'HP', 'EliteBook 840 G5 (Sample)',
      16, 512, true, 'fair', 'swollen', true, true, true,
      3500, 30, 24000,
      'pending', NULL, NULL, NULL,
      'quarantined', '1e891458-a4cb-45d4-b676-0750e8738d39', '2026-10-28T10:40:00Z', '2026-10-28T10:45:00Z'
    ),
    (
      '11111111-1111-4111-8111-111111111104', 'FG-DEMO-104', 'desktop', 'HP', 'ProDesk 600 G2 SFF (Sample)',
      8, NULL, false, 'poor', 'not_applicable', false, false, true,
      20000, 60, 8000,
      'not_applicable', NULL, NULL, 'No drive caddies or non-volatile storage media installed at intake.',
      'recycle_review', '1e891458-a4cb-45d4-b676-0750e8738d39', '2026-10-28T11:20:00Z', '2026-10-28T11:35:00Z'
    ),
    (
      '11111111-1111-4111-8111-111111111105', 'FG-DEMO-105', 'tablet', 'Apple', 'iPad 7th Gen 32GB (Sample)',
      3, 32, true, 'good', 'normal', true, true, false,
      1500, 20, NULL,
      'pending', NULL, NULL, NULL,
      'intake', '1e891458-a4cb-45d4-b676-0750e8738d39', '2026-10-28T12:10:00Z', '2026-10-28T12:10:00Z'
    ),
    (
      '11111111-1111-4111-8111-111111111106', 'FG-DEMO-106', 'desktop', 'Dell', 'OptiPlex 7060 Micro (Sample)',
      16, 512, true, 'good', 'not_applicable', true, true, true,
      1500, 30, 14000,
      'pending', NULL, NULL, NULL,
      'repairing', '1e891458-a4cb-45d4-b676-0750e8738d39', '2026-10-28T13:00:00Z', '2026-10-28T13:25:00Z'
    );

    INSERT INTO public.assessments (
      device_id, input_snapshot, config_snapshot, decision, rule_version,
      reason_codes, reason_details, missing_fields, cost_breakdown,
      repair_cost_cents, margin_cents, sanitization_gate_open,
      assessed_by, assessed_by_name, created_at
    ) VALUES
    (
      '11111111-1111-4111-8111-111111111101',
      '{"category":"laptop","brand":"Lenovo","model":"ThinkPad T480 (Sample)","ramGb":8,"storageGb":256,"boots":true,"condition":"good","batterySafety":"normal","storagePresent":true,"repairable":true,"chargerIncluded":true,"partsCostCents":2000,"estimatedLaborMinutes":45,"comparableValueCents":18000}'::jsonb,
      '{"ruleVersion":"1.0.0","hourlyRateCents":2000,"minMarginCents":2000,"minLaptopRamGb":8,"overheadCents":0,"baselineMinutes":12,"targetMinutes":6}'::jsonb,
      'REFURBISH_CANDIDATE', '1.0.0',
      '["VIABLE_COST_AND_FUNCTION"]'::jsonb,
      '["Device boots, is repairable, meets the 8 GB RAM baseline, and yields an estimated net margin of $145.00 (>= $20.00 threshold)."]'::jsonb,
      '[]'::jsonb,
      '{"partsCostCents":2000,"laborCostCents":1500,"overheadCents":0,"totalRepairCostCents":3500,"comparableValueCents":18000,"marginCents":14500,"hourlyRateCents":2000,"estimatedLaborMinutes":45}'::jsonb,
      3500, 14500, true,
      '1e891458-a4cb-45d4-b676-0750e8738d39', 'Alex Rivera (Senior Bench Technician)', '2026-10-28T09:15:00Z'
    ),
    (
      '11111111-1111-4111-8111-111111111102',
      '{"category":"laptop","brand":"Dell","model":"Latitude E5450 (Sample)","ramGb":4,"storageGb":128,"boots":true,"condition":"fair","batterySafety":"normal","storagePresent":true,"repairable":true,"chargerIncluded":false,"partsCostCents":4000,"estimatedLaborMinutes":90,"comparableValueCents":7000}'::jsonb,
      '{"ruleVersion":"1.0.0","hourlyRateCents":2000,"minMarginCents":2000,"minLaptopRamGb":8,"overheadCents":0,"baselineMinutes":12,"targetMinutes":6}'::jsonb,
      'REVIEW_REQUIRED', '1.0.0',
      '["BELOW_MARGIN_THRESHOLD","LOW_RAM","SANITIZATION_GATE_PENDING"]'::jsonb,
      '["Estimated net margin ($0.00) is below the $20.00 refurbishment threshold.","Laptop RAM (4 GB) is below the 8 GB minimum heuristic.","Storage sanitization verification is pending."]'::jsonb,
      '[]'::jsonb,
      '{"partsCostCents":4000,"laborCostCents":3000,"overheadCents":0,"totalRepairCostCents":7000,"comparableValueCents":7000,"marginCents":0,"hourlyRateCents":2000,"estimatedLaborMinutes":90}'::jsonb,
      7000, 0, false,
      '1e891458-a4cb-45d4-b676-0750e8738d39', 'Alex Rivera (Senior Bench Technician)', '2026-10-28T10:05:00Z'
    ),
    (
      '11111111-1111-4111-8111-111111111103',
      '{"category":"laptop","brand":"HP","model":"EliteBook 840 G5 (Sample)","ramGb":16,"storageGb":512,"boots":true,"condition":"fair","batterySafety":"swollen","storagePresent":true,"repairable":true,"chargerIncluded":true,"partsCostCents":3500,"estimatedLaborMinutes":30,"comparableValueCents":24000}'::jsonb,
      '{"ruleVersion":"1.0.0","hourlyRateCents":2000,"minMarginCents":2000,"minLaptopRamGb":8,"overheadCents":0,"baselineMinutes":12,"targetMinutes":6}'::jsonb,
      'QUARANTINE', '1.0.0',
      '["SAFETY_BATTERY_SWOLLEN","SANITIZATION_GATE_PENDING"]'::jsonb,
      '["Swollen battery hazard requires immediate safety quarantine and isolation before any refurbishment work.","Storage sanitization verification is pending."]'::jsonb,
      '[]'::jsonb,
      '{"partsCostCents":3500,"laborCostCents":1000,"overheadCents":0,"totalRepairCostCents":4500,"comparableValueCents":24000,"marginCents":19500,"hourlyRateCents":2000,"estimatedLaborMinutes":30}'::jsonb,
      4500, 19500, false,
      '1e891458-a4cb-45d4-b676-0750e8738d39', 'Alex Rivera (Senior Bench Technician)', '2026-10-28T10:40:00Z'
    ),
    (
      '11111111-1111-4111-8111-111111111104',
      '{"category":"desktop","brand":"HP","model":"ProDesk 600 G2 SFF (Sample)","ramGb":8,"storageGb":null,"boots":false,"condition":"poor","batterySafety":"not_applicable","storagePresent":false,"repairable":false,"chargerIncluded":true,"partsCostCents":20000,"estimatedLaborMinutes":60,"comparableValueCents":8000}'::jsonb,
      '{"ruleVersion":"1.0.0","hourlyRateCents":2000,"minMarginCents":2000,"minLaptopRamGb":8,"overheadCents":0,"baselineMinutes":12,"targetMinutes":6}'::jsonb,
      'RECYCLE_REVIEW', '1.0.0',
      '["NOT_REPAIRABLE_AND_NEGATIVE_MARGIN","BOOT_FAILURE","POOR_PHYSICAL_CONDITION"]'::jsonb,
      '["Device is marked not repairable and total repair cost ($220.00) exceeds comparable value ($80.00) for a net margin of -$140.00."]'::jsonb,
      '[]'::jsonb,
      '{"partsCostCents":20000,"laborCostCents":2000,"overheadCents":0,"totalRepairCostCents":22000,"comparableValueCents":8000,"marginCents":-14000,"hourlyRateCents":2000,"estimatedLaborMinutes":60}'::jsonb,
      22000, -14000, true,
      '1e891458-a4cb-45d4-b676-0750e8738d39', 'Alex Rivera (Senior Bench Technician)', '2026-10-28T11:20:00Z'
    ),
    (
      '11111111-1111-4111-8111-111111111105',
      '{"category":"tablet","brand":"Apple","model":"iPad 7th Gen 32GB (Sample)","ramGb":3,"storageGb":32,"boots":true,"condition":"good","batterySafety":"normal","storagePresent":true,"repairable":true,"chargerIncluded":false,"partsCostCents":1500,"estimatedLaborMinutes":20,"comparableValueCents":null}'::jsonb,
      '{"ruleVersion":"1.0.0","hourlyRateCents":2000,"minMarginCents":2000,"minLaptopRamGb":8,"overheadCents":0,"baselineMinutes":12,"targetMinutes":6}'::jsonb,
      'INSUFFICIENT_DATA', '1.0.0',
      '["MISSING_CRITICAL_INPUTS","SANITIZATION_GATE_PENDING"]'::jsonb,
      '["Missing critical intake inputs required for economic evaluation: comparableValueCents.","Storage sanitization verification is pending."]'::jsonb,
      '["comparableValueCents"]'::jsonb,
      NULL, NULL, NULL, false,
      '1e891458-a4cb-45d4-b676-0750e8738d39', 'Alex Rivera (Senior Bench Technician)', '2026-10-28T12:10:00Z'
    ),
    (
      '11111111-1111-4111-8111-111111111106',
      '{"category":"desktop","brand":"Dell","model":"OptiPlex 7060 Micro (Sample)","ramGb":16,"storageGb":512,"boots":true,"condition":"good","batterySafety":"not_applicable","storagePresent":true,"repairable":true,"chargerIncluded":true,"partsCostCents":1500,"estimatedLaborMinutes":30,"comparableValueCents":14000}'::jsonb,
      '{"ruleVersion":"1.0.0","hourlyRateCents":2000,"minMarginCents":2000,"minLaptopRamGb":8,"overheadCents":0,"baselineMinutes":12,"targetMinutes":6}'::jsonb,
      'REFURBISH_CANDIDATE', '1.0.0',
      '["VIABLE_COST_AND_FUNCTION","SANITIZATION_GATE_PENDING"]'::jsonb,
      '["Estimated net margin ($115.00) meets or exceeds the $20.00 minimum refurbishment margin threshold.","Storage sanitization verification is pending before device can reach ready or closed."]'::jsonb,
      '[]'::jsonb,
      '{"partsCostCents":1500,"laborCostCents":1000,"overheadCents":0,"totalRepairCostCents":2500,"comparableValueCents":14000,"marginCents":11500,"hourlyRateCents":2000,"estimatedLaborMinutes":30}'::jsonb,
      2500, 11500, false,
      '1e891458-a4cb-45d4-b676-0750e8738d39', 'Alex Rivera (Senior Bench Technician)', '2026-10-28T13:00:00Z'
    );

    INSERT INTO public.workflow_events (
      device_id, from_status, to_status, actor_id, actor_name, actor_role, note, created_at
    ) VALUES
    ('11111111-1111-4111-8111-111111111101', NULL, 'intake', '1e891458-a4cb-45d4-b676-0750e8738d39', 'Alex Rivera (Senior Bench Technician)', 'technician', 'Initial intake recorded for Case A — Viable Refurbish Laptop.', '2026-10-28T09:15:00Z'),
    ('11111111-1111-4111-8111-111111111101', 'intake', 'assessed', '1e891458-a4cb-45d4-b676-0750e8738d39', 'Alex Rivera (Senior Bench Technician)', 'technician', 'Deterministic assessment v1.0.0 completed (REFURBISH_CANDIDATE).', '2026-10-28T09:20:00Z'),
    ('11111111-1111-4111-8111-111111111101', 'assessed', 'approved_refurb', 'ae4b5f9f-11ae-4b3f-b26e-ba18dda049d8', 'Morgan Chen (Operations Manager & Admin)', 'manager', 'Manager approved refurbishment candidate based on positive net margin ($145.00).', '2026-10-28T09:30:00Z'),
    ('11111111-1111-4111-8111-111111111102', NULL, 'intake', '1e891458-a4cb-45d4-b676-0750e8738d39', 'Alex Rivera (Senior Bench Technician)', 'technician', 'Initial intake recorded for Case B — Borderline Low-RAM / Low-Margin Laptop.', '2026-10-28T10:05:00Z'),
    ('11111111-1111-4111-8111-111111111102', 'intake', 'assessed', '1e891458-a4cb-45d4-b676-0750e8738d39', 'Alex Rivera (Senior Bench Technician)', 'technician', 'Deterministic assessment v1.0.0 completed (REVIEW_REQUIRED).', '2026-10-28T10:10:00Z'),
    ('11111111-1111-4111-8111-111111111103', NULL, 'intake', '1e891458-a4cb-45d4-b676-0750e8738d39', 'Alex Rivera (Senior Bench Technician)', 'technician', 'Initial intake recorded for Case C — Swollen Battery Safety Hazard.', '2026-10-28T10:40:00Z'),
    ('11111111-1111-4111-8111-111111111103', 'intake', 'quarantined', '1e891458-a4cb-45d4-b676-0750e8738d39', 'Alex Rivera (Senior Bench Technician)', 'technician', 'Swollen battery detected during intake check; isolated in safety quarantine.', '2026-10-28T10:45:00Z'),
    ('11111111-1111-4111-8111-111111111104', NULL, 'intake', '1e891458-a4cb-45d4-b676-0750e8738d39', 'Alex Rivera (Senior Bench Technician)', 'technician', 'Initial intake recorded for Case D — Economically Unviable / Irreparable.', '2026-10-28T11:20:00Z'),
    ('11111111-1111-4111-8111-111111111104', 'intake', 'assessed', '1e891458-a4cb-45d4-b676-0750e8738d39', 'Alex Rivera (Senior Bench Technician)', 'technician', 'Deterministic assessment v1.0.0 completed (RECYCLE_REVIEW).', '2026-10-28T11:25:00Z'),
    ('11111111-1111-4111-8111-111111111104', 'assessed', 'recycle_review', 'ae4b5f9f-11ae-4b3f-b26e-ba18dda049d8', 'Morgan Chen (Operations Manager & Admin)', 'manager', 'Manager confirmed negative repair margin and non-repairable mainboard; queued for recycle review.', '2026-10-28T11:35:00Z'),
    ('11111111-1111-4111-8111-111111111105', NULL, 'intake', '1e891458-a4cb-45d4-b676-0750e8738d39', 'Alex Rivera (Senior Bench Technician)', 'technician', 'Initial intake recorded for Case E — Missing Comparable Value Input.', '2026-10-28T12:10:00Z'),
    ('11111111-1111-4111-8111-111111111106', NULL, 'intake', '1e891458-a4cb-45d4-b676-0750e8738d39', 'Alex Rivera (Senior Bench Technician)', 'technician', 'Initial intake recorded for Case F — Viable Refurbish with Pending Sanitization Gate.', '2026-10-28T13:00:00Z'),
    ('11111111-1111-4111-8111-111111111106', 'intake', 'assessed', '1e891458-a4cb-45d4-b676-0750e8738d39', 'Alex Rivera (Senior Bench Technician)', 'technician', 'Deterministic assessment v1.0.0 completed (REFURBISH_CANDIDATE).', '2026-10-28T13:05:00Z'),
    ('11111111-1111-4111-8111-111111111106', 'assessed', 'approved_refurb', 'ae4b5f9f-11ae-4b3f-b26e-ba18dda049d8', 'Morgan Chen (Operations Manager & Admin)', 'manager', 'Manager approved refurbishment candidate based on positive net margin ($115.00).', '2026-10-28T13:15:00Z'),
    ('11111111-1111-4111-8111-111111111106', 'approved_refurb', 'repairing', '1e891458-a4cb-45d4-b676-0750e8738d39', 'Alex Rivera (Senior Bench Technician)', 'technician', 'Bench repair started; awaiting external storage sanitization verification before marking ready.', '2026-10-28T13:25:00Z');
    COMMIT;
