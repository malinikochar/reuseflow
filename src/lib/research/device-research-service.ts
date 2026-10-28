import { z } from 'zod';

export const DeviceResearchCategorySchema = z.enum(['laptop', 'desktop', 'tablet']);
export const DeviceResearchConditionSchema = z.enum(['good', 'fair', 'poor', 'unknown']);
export const DeviceResearchBatterySafetySchema = z.enum([
  'normal',
  'degraded',
  'swollen',
  'unknown',
  'not_applicable',
]);

export const DeviceResearchInputSchema = z.object({
  brand: z.string().trim().min(1, 'Brand is required').max(80),
  model: z.string().trim().min(1, 'Model is required').max(120),
  category: DeviceResearchCategorySchema.default('laptop'),
  condition: DeviceResearchConditionSchema.optional().default('good'),
  ramGb: z.number().min(0).max(1024).nullable().optional(),
  storageGb: z.number().min(0).max(32768).nullable().optional(),
  batterySafety: DeviceResearchBatterySafetySchema.optional().default('normal'),
  boots: z.boolean().nullable().optional(),
  customQuery: z.string().trim().max(300).optional(),
});

export type DeviceResearchInput = z.infer<typeof DeviceResearchInputSchema>;

export interface TavilyCitation {
  title: string;
  url: string;
  snippet: string;
  score?: number;
}

export interface DeviceResearchBrief {
  queryExecuted: string;
  generatedAt: string;
  executiveSummary: string;
  suggestedCompRangeDollars: {
    low: number;
    mid: number;
    high: number;
    confidenceNote: string;
  };
  estimatedPartsNotes: {
    typicalPartsNeeded: string;
    estimatedPartsCostDollars: number;
  };
  repairabilityAndUpgradeNotes: string[];
  safetyAndSanitizationChecklist: string[];
  communityReuseFit: string;
  citations: TavilyCitation[];
  providerStatus: {
    tavilyLive: boolean;
    nebiusLive: boolean;
    nebiusModel: string;
    fallbackUsed: boolean;
  };
  advisoryDisclaimer: string;
}

interface TavilySearchResultItem {
  title?: string;
  url?: string;
  content?: string;
  score?: number;
}

interface TavilySearchResponse {
  query?: string;
  answer?: string;
  results?: TavilySearchResultItem[];
}

const NebiusSynthesisSchema = z.object({
  executiveSummary: z.string(),
  suggestedCompRangeDollars: z.object({
    low: z.number(),
    mid: z.number(),
    high: z.number(),
    confidenceNote: z.string(),
  }),
  estimatedPartsNotes: z.object({
    typicalPartsNeeded: z.string(),
    estimatedPartsCostDollars: z.number(),
  }),
  repairabilityAndUpgradeNotes: z.array(z.string()).min(1),
  safetyAndSanitizationChecklist: z.array(z.string()).min(1),
  communityReuseFit: z.string(),
});

export function buildTavilyDeviceQuery(input: DeviceResearchInput): string {
  const specs = [
    input.brand,
    input.model,
    input.ramGb ? `${input.ramGb}GB RAM` : '',
    input.storageGb ? `${input.storageGb}GB` : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (input.customQuery && input.customQuery.trim().length > 0) {
    return `${specs} ${input.customQuery.trim()} refurbishment repairability price`.slice(0, 380);
  }

  return `${specs} refurbished market price comparable value repairability guide battery replacement`.slice(
    0,
    380
  );
}

export function buildDeterministicFallbackBrief(
  input: DeviceResearchInput,
  queryExecuted: string,
  citations: TavilyCitation[] = [],
  tavilyAnswer?: string
): DeviceResearchBrief {
  const baseByCategory: Record<
    DeviceResearchInput['category'],
    { low: number; mid: number; high: number; parts: number }
  > = {
    laptop: { low: 140, mid: 210, high: 285, parts: 35 },
    desktop: { low: 110, mid: 165, high: 230, parts: 25 },
    tablet: { low: 95, mid: 145, high: 195, parts: 30 },
  };

  const base = baseByCategory[input.category];
  const conditionMultiplier =
    input.condition === 'good'
      ? 1.05
      : input.condition === 'fair'
        ? 0.85
        : input.condition === 'poor'
          ? 0.55
          : 0.8;

  const ramBonus = input.ramGb && input.ramGb >= 16 ? 35 : input.ramGb && input.ramGb >= 8 ? 10 : 0;
  const storageBonus =
    input.storageGb && input.storageGb >= 512 ? 25 : input.storageGb && input.storageGb >= 256 ? 10 : 0;

  const low = Math.max(15, Math.round((base.low + ramBonus + storageBonus) * conditionMultiplier));
  const mid = Math.max(low + 15, Math.round((base.mid + ramBonus + storageBonus) * conditionMultiplier));
  const high = Math.max(mid + 20, Math.round((base.high + ramBonus + storageBonus) * conditionMultiplier));

  const batteryNote =
    input.batterySafety === 'swollen'
      ? 'CRITICAL: Swollen battery flagged — isolate unit in fire-safe quarantine container immediately before any bench work.'
      : input.batterySafety === 'degraded'
        ? 'Battery health is degraded — budget ~$35-$55 for OEM-equivalent battery replacement if targeting refurbished distribution.'
        : 'Inspect battery pack for swelling or thermal wear under load test before closing chassis.';

  return {
    queryExecuted,
    generatedAt: new Date().toISOString(),
    executiveSummary:
      tavilyAnswer && tavilyAnswer.trim().length > 20
        ? tavilyAnswer.trim()
        : `${input.brand} ${input.model} (${input.category}, ${input.condition ?? 'good'} condition) is a standard refurbishment candidate. Verify secondary-market comparable value ($${low}–$${high} reference range) and inspect wear components before finalizing the deterministic v1.0.0 pathway.`,
    suggestedCompRangeDollars: {
      low,
      mid,
      high,
      confidenceNote:
        citations.length > 0
          ? `Derived from ${citations.length} live web sources and hardware spec tier. Requires human verification before applying to v1.0.0 engine.`
          : 'Heuristic spec-tier estimate (offline fallback). Verify against current secondary market listings before saving.',
    },
    estimatedPartsNotes: {
      typicalPartsNeeded:
        input.category === 'laptop' || input.category === 'tablet'
          ? 'AC adapter/charger, thermal paste refresh, battery health check, or SSD caddy'
          : 'Power cable, CMOS battery, SATA/NVMe mount, and port cleaning',
      estimatedPartsCostDollars: base.parts,
    },
    repairabilityAndUpgradeNotes: [
      `Verify ${input.brand} ${input.model} service manual for FRU part numbers, bottom-cover fastener layout, and RAM/storage socket accessibility.`,
      input.ramGb && input.ramGb < 16
        ? `Current RAM is ${input.ramGb}GB — check if SODIMM slots are socketed vs. soldered; upgrading to 16GB significantly improves desktop longevity.`
        : 'Memory capacity meets modern multitasking baseline; run UEFI diagnostics to confirm zero bit errors.',
      'Check hinge torque, charging port mechanical play, and display backlight uniformity during bench intake.',
    ],
    safetyAndSanitizationChecklist: [
      batteryNote,
      'Storage-bearing devices CANNOT transition to Ready/Closed until human-verified media sanitization or physical drive removal is recorded in the audit log.',
      'ReuseFlow does not perform automated disk wiping — record the technician-verified sanitization method on the physical traveler.',
    ],
    communityReuseFit:
      mid >= 170
        ? 'Strong candidate for Refurbishment margin recovery or high-need student/workforce placement depending on queue targets.'
        : 'Well-suited for Community Reuse / digital inclusion distribution if functional and labor hours remain within threshold.',
    citations,
    providerStatus: {
      tavilyLive: citations.length > 0,
      nebiusLive: false,
      nebiusModel: process.env.NEBIUS_MODEL || 'Qwen/Qwen3-30B-A3B-Instruct-2507',
      fallbackUsed: true,
    },
    advisoryDisclaimer:
      'Advisory AI + Web Research Brief only. All refurbishment pathways, safety gates, and integer-cent economics are governed by the deterministic ReuseFlow v1.0.0 rules engine and require human approval.',
  };
}

export async function runDeviceResearch(rawInput: unknown): Promise<DeviceResearchBrief> {
  const input = DeviceResearchInputSchema.parse(rawInput);
  const queryExecuted = buildTavilyDeviceQuery(input);

  const tavilyApiKey = process.env.TAVILY_API_KEY?.trim();
  const nebiusApiKey = process.env.NEBIUS_API_KEY?.trim();
  const nebiusBaseUrl = (
    process.env.NEBIUS_BASE_URL || 'https://api.tokenfactory.nebius.com/v1'
  ).replace(/\/+$/, '');
  const nebiusModel = process.env.NEBIUS_MODEL || 'Qwen/Qwen3-30B-A3B-Instruct-2507';

  let citations: TavilyCitation[] = [];
  let tavilyAnswer = '';
  let tavilyLive = false;

  // 1. Live Web Search via Tavily API
  if (tavilyApiKey) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 9000);
      const tavilyRes = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tavilyApiKey}`,
        },
        body: JSON.stringify({
          query: queryExecuted,
          search_depth: 'basic',
          max_results: 5,
          include_answer: true,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (tavilyRes.ok) {
        const data = (await tavilyRes.json()) as TavilySearchResponse;
        tavilyAnswer = data.answer || '';
        citations = (data.results || [])
          .filter((r) => Boolean(r.title && r.url))
          .slice(0, 5)
          .map((r) => ({
            title: (r.title || 'Web Source').trim(),
            url: (r.url || '').trim(),
            snippet: (r.content || '').trim().slice(0, 320),
            score: r.score,
          }));
        tavilyLive = citations.length > 0;
      }
    } catch {
      tavilyLive = false;
    }
  }

  const fallbackBrief = buildDeterministicFallbackBrief(
    input,
    queryExecuted,
    citations,
    tavilyAnswer
  );

  // 2. LLM Synthesis via Nebius TokenFactory API
  if (!nebiusApiKey) {
    return fallbackBrief;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 14000);

    const webContextText =
      citations.length > 0
        ? citations
            .map((c, idx) => `[Source ${idx + 1}] ${c.title} (${c.url}): ${c.snippet}`)
            .join('\n')
        : 'No live web snippets returned; rely on hardware specification knowledge.';

    const systemPrompt = `You are the ReuseFlow Bench Research & Refurbishment Copilot assisting electronics refurbishment technicians and operations managers.
Your output is strictly ADVISORY and complements ReuseFlow's deterministic v1.0.0 integer-cent decision engine.
Never claim that the app performs certified data wiping or autonomous disposal.
Respond ONLY with a valid JSON object matching this exact structure (no markdown code fences, no extra keys):
{
  "executiveSummary": "2-3 concise sentences on refurbished market standing, common hardware bottlenecks, and refurbishment viability.",
  "suggestedCompRangeDollars": {
    "low": 120,
    "mid": 175,
    "high": 230,
    "confidenceNote": "1 sentence explaining the basis of this refurbished price estimate and noting human verification is required."
  },
  "estimatedPartsNotes": {
    "typicalPartsNeeded": "Common replacement parts for this model (e.g. battery, USB-C port, SSD caddy, charger)",
    "estimatedPartsCostDollars": 35
  },
  "repairabilityAndUpgradeNotes": [
    "Actionable technician point 1 (RAM/SSD upgradeability, socketed vs soldered)",
    "Actionable technician point 2 (disassembly / fastener / thermal service note)",
    "Actionable technician point 3 (known model-specific failure modes to check)"
  ],
  "safetyAndSanitizationChecklist": [
    "Safety note (especially Li-ion swollen battery quarantine if applicable)",
    "Human-verified data sanitization requirement before Ready/Closed state"
  ],
  "communityReuseFit": "1-2 sentences comparing Retail Refurbish margin potential vs Community Reuse digital-inclusion fit."
}`;

    const userPrompt = `Device under bench inspection:
- Brand & Model: ${input.brand} ${input.model}
- Category: ${input.category}
- Physical Condition: ${input.condition ?? 'good'}
- RAM: ${input.ramGb !== null && input.ramGb !== undefined ? `${input.ramGb} GB` : 'Unspecified'}
- Storage: ${input.storageGb !== null && input.storageGb !== undefined ? `${input.storageGb} GB` : 'Unspecified'}
- Boots to BIOS/OS: ${input.boots === true ? 'Yes' : input.boots === false ? 'No' : 'Unverified'}
- Battery Safety State: ${input.batterySafety ?? 'normal'}
${input.customQuery ? `- Technician Question: ${input.customQuery}` : ''}

Live Tavily Web Search Context:
${tavilyAnswer ? `Tavily Summary: ${tavilyAnswer}\n` : ''}${webContextText}

Return ONLY the raw JSON object.`;

    const nebiusRes = await fetch(`${nebiusBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${nebiusApiKey}`,
      },
      body: JSON.stringify({
        model: nebiusModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 900,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!nebiusRes.ok) {
      return fallbackBrief;
    }

    const completion = (await nebiusRes.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      model?: string;
    };
    const rawContent = completion.choices?.[0]?.message?.content?.trim() || '';

    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return fallbackBrief;
    }

    const parsedJson = JSON.parse(jsonMatch[0]);
    const validated = NebiusSynthesisSchema.safeParse(parsedJson);
    if (!validated.success) {
      return fallbackBrief;
    }

    const synth = validated.data;
    const low = Math.max(5, Math.round(synth.suggestedCompRangeDollars.low));
    const mid = Math.max(low, Math.round(synth.suggestedCompRangeDollars.mid));
    const high = Math.max(mid, Math.round(synth.suggestedCompRangeDollars.high));

    return {
      queryExecuted,
      generatedAt: new Date().toISOString(),
      executiveSummary: synth.executiveSummary,
      suggestedCompRangeDollars: {
        low,
        mid,
        high,
        confidenceNote: synth.suggestedCompRangeDollars.confidenceNote,
      },
      estimatedPartsNotes: {
        typicalPartsNeeded: synth.estimatedPartsNotes.typicalPartsNeeded,
        estimatedPartsCostDollars: Math.max(
          0,
          Math.round(synth.estimatedPartsNotes.estimatedPartsCostDollars)
        ),
      },
      repairabilityAndUpgradeNotes: synth.repairabilityAndUpgradeNotes,
      safetyAndSanitizationChecklist: synth.safetyAndSanitizationChecklist,
      communityReuseFit: synth.communityReuseFit,
      citations,
      providerStatus: {
        tavilyLive,
        nebiusLive: true,
        nebiusModel: completion.model || nebiusModel,
        fallbackUsed: false,
      },
      advisoryDisclaimer:
        'Advisory AI + Web Research Brief only. All refurbishment pathways, safety gates, and integer-cent economics are governed by the deterministic ReuseFlow v1.0.0 rules engine and require human approval.',
    };
  } catch {
    return fallbackBrief;
  }
}
