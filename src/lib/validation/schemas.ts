import { z } from 'zod';

export const deviceCategorySchema = z.enum(['laptop', 'desktop', 'tablet']);
export const conditionSchema = z.enum(['good', 'fair', 'poor', 'unknown']);
export const batterySafetySchema = z.enum([
  'normal',
  'degraded',
  'swollen',
  'unknown',
  'not_applicable',
]);
export const sanitizationStatusSchema = z.enum(['pending', 'verified', 'not_applicable']);
export const workflowStatusSchema = z.enum([
  'intake',
  'assessed',
  'approved_refurb',
  'repairing',
  'ready',
  'recycle_review',
  'quarantined',
  'closed',
]);
export const dispositionSchema = z.enum(['distributed', 'recycled', 'other_authorized']);
export const userRoleSchema = z.enum(['manager', 'technician', 'viewer']);

const nullableNonNegativeInt = (max: number, label: string) =>
  z
    .number({ invalid_type_error: `${label} must be a finite number` })
    .finite(`${label} must be finite`)
    .int(`${label} must be an integer`)
    .min(0, `${label} cannot be negative`)
    .max(max, `${label} exceeds maximum (${max})`)
    .nullable()
    .optional();

export const assessmentInputSchema = z
  .object({
    category: deviceCategorySchema,
    brand: z.string().trim().max(80, 'Brand must be 80 characters or fewer').optional(),
    model: z.string().trim().max(120, 'Model must be 120 characters or fewer').optional(),
    ramGb: nullableNonNegativeInt(1024, 'RAM (GB)'),
    storageGb: nullableNonNegativeInt(32768, 'Storage (GB)'),
    boots: z.boolean().nullable().optional(),
    condition: conditionSchema,
    batterySafety: batterySafetySchema,
    storagePresent: z.boolean(),
    repairable: z.boolean().nullable().optional(),
    chargerIncluded: z.boolean().nullable().optional(),
    partsCostCents: nullableNonNegativeInt(10_000_000, 'Parts cost (cents)'),
    estimatedLaborMinutes: nullableNonNegativeInt(10_000, 'Estimated labor (minutes)'),
    comparableValueCents: nullableNonNegativeInt(10_000_000, 'Comparable value (cents)'),
  })
  .superRefine((val, ctx) => {
    // Desktops normally have batterySafety = 'not_applicable' or 'normal'; laptops/tablets cannot be 'not_applicable' unless explicitly noted,
    // wait: let's prevent impossible combination where storageGb > 0 when storagePresent is false.
    if (!val.storagePresent && typeof val.storageGb === 'number' && val.storageGb > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['storageGb'],
        message: 'Storage capacity must be empty or 0 when storagePresent is false.',
      });
    }
    if (
      (val.category === 'laptop' || val.category === 'tablet') &&
      val.batterySafety === 'not_applicable'
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['batterySafety'],
        message: 'Portable devices (laptops/tablets) must specify battery safety status.',
      });
    }
  });

const deviceCreateBaseSchema = z.object({
  assetTag: z
    .string()
    .trim()
    .min(3, 'Asset tag must be at least 3 characters')
    .max(32, 'Asset tag must be 32 characters or fewer')
    .regex(/^[A-Za-z0-9-_]+$/, 'Asset tag may only contain letters, numbers, hyphens, and underscores'),
  category: deviceCategorySchema,
  brand: z.string().trim().min(1, 'Brand is required').max(80, 'Brand too long'),
  model: z.string().trim().min(1, 'Model is required').max(120, 'Model too long'),
  ramGb: nullableNonNegativeInt(1024, 'RAM (GB)'),
  storageGb: nullableNonNegativeInt(32768, 'Storage (GB)'),
  boots: z.boolean().nullable().optional(),
  condition: conditionSchema,
  batterySafety: batterySafetySchema,
  storagePresent: z.boolean(),
  repairable: z.boolean().nullable().optional(),
  chargerIncluded: z.boolean().nullable().optional(),
  partsCostCents: nullableNonNegativeInt(10_000_000, 'Parts cost (cents)'),
  estimatedLaborMinutes: nullableNonNegativeInt(10_000, 'Estimated labor (minutes)'),
  comparableValueCents: nullableNonNegativeInt(10_000_000, 'Comparable value (cents)'),
});

export const deviceCreateSchema = deviceCreateBaseSchema.superRefine((val, ctx) => {
  if (!val.storagePresent && typeof val.storageGb === 'number' && val.storageGb > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['storageGb'],
      message: 'Storage capacity cannot be positive when no storage media is present.',
    });
  }
  if (
    (val.category === 'laptop' || val.category === 'tablet') &&
    val.batterySafety === 'not_applicable'
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['batterySafety'],
      message: 'Laptops and tablets require a battery safety check (cannot be N/A).',
    });
  }
});

export const deviceUpdateIntakeSchema = deviceCreateBaseSchema.partial().extend({
  id: z.string().min(1, 'Device ID is required'),
  expectedUpdatedAt: z.string().optional(),
});

export const transitionDeviceSchema = z
  .object({
    deviceId: z.string().min(1, 'Device ID is required'),
    expectedStatus: workflowStatusSchema,
    nextStatus: workflowStatusSchema,
    note: z
      .string()
      .trim()
      .min(3, 'Please provide a brief audit note (at least 3 characters)')
      .max(500, 'Note must be 500 characters or fewer'),
    disposition: dispositionSchema.nullable().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.nextStatus === 'closed' && !val.disposition) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['disposition'],
        message: 'Closing a device record requires selecting an authorized disposition.',
      });
    }
  });

export const verifySanitizationSchema = z.object({
  deviceId: z.string().min(1, 'Device ID is required'),
  status: sanitizationStatusSchema,
  note: z
    .string()
    .trim()
    .min(5, 'Record method/reference note (at least 5 characters) forexternal sanitization check')
    .max(500, 'Note must be 500 characters or fewer'),
});

export const engineConfigSchema = z.object({
  ruleVersion: z.literal('1.0.0').default('1.0.0'),
  hourlyRateCents: z.number().int().min(0).max(500_000),
  minMarginCents: z.number().int().min(-100_000).max(1_000_000),
  minLaptopRamGb: z.number().int().min(1).max(256),
  overheadCents: z.number().int().min(0).max(500_000),
  baselineMinutes: z.number().int().min(1).max(480),
  targetMinutes: z.number().int().min(1).max(480),
});

export const scenarioInputSchema = z.object({
  devicesPerMonth: z.number().int().min(0).max(100_000),
  baselineMinutesPerDevice: z.number().min(0).max(600),
  proposedMinutesPerDevice: z.number().min(0).max(600),
  hourlyLaborRateCents: z.number().int().min(0).max(500_000),
  implementationCostCents: z.number().int().min(0).max(100_000_000),
  monthlySoftwareCostCents: z.number().int().min(0).max(10_000_000),
});

export const sendSummaryEmailSchema = z.object({
  recipient: z.string().trim().email('Valid email address required'),
  scope: z.enum(['all', 'refurbish_candidates', 'quarantined']).default('all'),
  idempotencyKey: z.string().trim().min(8).max(128),
});

export type DeviceCreateInput = z.infer<typeof deviceCreateSchema>;
export type DeviceUpdateIntakeInput = z.infer<typeof deviceUpdateIntakeSchema>;
export type TransitionDeviceInput = z.infer<typeof transitionDeviceSchema>;
export type VerifySanitizationInput = z.infer<typeof verifySanitizationSchema>;
