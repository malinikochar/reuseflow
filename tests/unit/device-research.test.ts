import { describe, expect, it } from 'vitest';
import {
  buildDeterministicFallbackBrief,
  buildTavilyDeviceQuery,
  DeviceResearchInputSchema,
  runDeviceResearch,
} from '@/lib/research/device-research-service';

describe('Tavily + Nebius Bench Research Service', () => {
  it('validates research inputs with Zod and constructs targeted search queries', () => {
    const parsed = DeviceResearchInputSchema.parse({
      brand: 'Lenovo',
      model: 'ThinkPad T480',
      category: 'laptop',
      condition: 'good',
      ramGb: 16,
      storageGb: 256,
      batterySafety: 'normal',
      boots: true,
    });

    const query = buildTavilyDeviceQuery(parsed);
    expect(query).toContain('Lenovo ThinkPad T480');
    expect(query).toContain('16GB RAM');
    expect(query).toContain('256GB');
    expect(query).toContain('refurbished market price');
  });

  it('includes custom technician query when provided and keeps query under 400 chars', () => {
    const parsed = DeviceResearchInputSchema.parse({
      brand: 'Apple',
      model: 'iPad 7th Gen',
      category: 'tablet',
      customQuery: 'iFixit screen digitizer adhesive replacement guide',
    });

    const query = buildTavilyDeviceQuery(parsed);
    expect(query).toContain('iFixit screen digitizer adhesive replacement guide');
    expect(query.length).toBeLessThanOrEqual(380);
  });

  it('produces a deterministic advisory fallback brief with swollen battery safety warning when applicable', () => {
    const input = DeviceResearchInputSchema.parse({
      brand: 'HP',
      model: 'ProBook 450 G6',
      category: 'laptop',
      condition: 'fair',
      ramGb: 8,
      storageGb: 256,
      batterySafety: 'swollen',
    });

    const brief = buildDeterministicFallbackBrief(input, buildTavilyDeviceQuery(input));
    expect(brief.suggestedCompRangeDollars.low).toBeGreaterThan(0);
    expect(brief.suggestedCompRangeDollars.mid).toBeGreaterThan(brief.suggestedCompRangeDollars.low);
    expect(brief.suggestedCompRangeDollars.high).toBeGreaterThan(brief.suggestedCompRangeDollars.mid);
    expect(brief.safetyAndSanitizationChecklist[0]).toContain('Swollen battery flagged');
    expect(brief.advisoryDisclaimer).toContain('ReuseFlow v1.0.0');
  });

  it('degrades gracefully to deterministic fallback when API keys are omitted in offline test mode', async () => {
    const prevTavily = process.env.TAVILY_API_KEY;
    const prevNebius = process.env.NEBIUS_API_KEY;
    delete process.env.TAVILY_API_KEY;
    delete process.env.NEBIUS_API_KEY;

    try {
      const brief = await runDeviceResearch({
        brand: 'Dell',
        model: 'OptiPlex 7050',
        category: 'desktop',
        condition: 'good',
        ramGb: 16,
        storageGb: 512,
      });

      expect(brief.providerStatus.fallbackUsed).toBe(true);
      expect(brief.suggestedCompRangeDollars.mid).toBeGreaterThan(100);
      expect(brief.repairabilityAndUpgradeNotes.length).toBeGreaterThanOrEqual(2);
    } finally {
      if (prevTavily) process.env.TAVILY_API_KEY = prevTavily;
      if (prevNebius) process.env.NEBIUS_API_KEY = prevNebius;
    }
  });
});
