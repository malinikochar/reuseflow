'use client';

import React, { useState, useEffect } from 'react';
import { Device, DeviceCategory, UserRole } from '@/types/domain';
import { DeviceResearchBrief } from '@/lib/research/device-research-service';
import { formatCents } from '@/lib/decision/engine';
import {
  Sparkles,
  Globe,
  Cpu,
  Wrench,
  ShieldAlert,
  ExternalLink,
  CheckCircle2,
  ArrowRight,
  Search,
  RefreshCw,
  DollarSign,
  BookOpen,
} from 'lucide-react';

interface DeviceResearchPanelProps {
  device: Device | null;
  allDevices?: Device[];
  actorRole?: UserRole;
  onSelectDevice?: (deviceId: string) => void;
  onApplySuggestedComp?: (
    suggestedCompCents: number,
    suggestedPartsCents?: number
  ) => Promise<{ ok: boolean; message?: string }>;
  compact?: boolean;
}

export function DeviceResearchPanel({
  device,
  allDevices = [],
  actorRole = 'manager',
  onSelectDevice,
  onApplySuggestedComp,
  compact = false,
}: DeviceResearchPanelProps) {
  const [brand, setBrand] = useState(device?.brand || 'Apple');
  const [model, setModel] = useState(device?.model || 'iPad 7th Gen');
  const [category, setCategory] = useState<DeviceCategory>(device?.category || 'tablet');
  const [ramGb, setRamGb] = useState<string>(
    device?.ramGb !== null && device?.ramGb !== undefined ? String(device.ramGb) : '3'
  );
  const [storageGb, setStorageGb] = useState<string>(
    device?.storageGb !== null && device?.storageGb !== undefined ? String(device.storageGb) : '32'
  );
  const [customQuery, setCustomQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [applyingComp, setApplyingComp] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [brief, setBrief] = useState<DeviceResearchBrief | null>(null);

  useEffect(() => {
    if (device) {
      setBrand(device.brand);
      setModel(device.model);
      setCategory(device.category);
      setRamGb(device.ramGb !== null && device.ramGb !== undefined ? String(device.ramGb) : '');
      setStorageGb(
        device.storageGb !== null && device.storageGb !== undefined ? String(device.storageGb) : ''
      );
      setAppliedSuccess(null);
    }
  }, [device]);

  const handleRunResearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setAppliedSuccess(null);

    try {
      const response = await fetch('/api/research/device-intel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: brand.trim() || 'Generic',
          model: model.trim() || 'Device',
          category,
          condition: device?.condition || 'good',
          ramGb: ramGb ? Number(ramGb) : null,
          storageGb: storageGb ? Number(storageGb) : null,
          batterySafety: device?.batterySafety || 'normal',
          boots: device?.boots ?? true,
          customQuery: customQuery.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Research request failed');
      }
      setBrief(data as DeviceResearchBrief);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete research request');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyComp = async (dollars: number, includeParts: boolean) => {
    if (!device || !onApplySuggestedComp) return;
    setApplyingComp(true);
    setError(null);
    try {
      const compCents = Math.round(dollars * 100);
      const partsCents =
        includeParts && brief
          ? Math.round(brief.estimatedPartsNotes.estimatedPartsCostDollars * 100)
          : undefined;
      const res = await onApplySuggestedComp(compCents, partsCents);
      if (!res.ok) {
        setError(res.message || 'Failed to apply comparable value');
        return;
      }
      setAppliedSuccess(
        `Applied $${dollars.toFixed(2)} comparable value${
          partsCents !== undefined ? ` & $${(partsCents / 100).toFixed(2)} est. parts` : ''
        } to ${device.assetTag} and re-ran deterministic v1.0.0 assessment.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply comparable value');
    } finally {
      setApplyingComp(false);
    }
  };

  return (
    <section
      aria-label="AI and Live Web Bench Research Copilot"
      className="genesis-card overflow-hidden"
    >
      {/* Header Banner */}
      <div className="bg-[#0A0A0A] text-[#FFFFFF] px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-[8px] bg-[#6366F1] flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-4 h-4 text-[#FFFFFF]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-[15px] font-bold tracking-tight text-[#FFFFFF]">
                AI Bench Research &amp; Market Comps Copilot
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] text-[10px] font-mono uppercase tracking-wider bg-[#6366F1]/25 text-[#C7D2FE] border border-[#6366F1]/40">
                <Globe className="w-2.5 h-2.5" /> Tavily Live Web
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] text-[10px] font-mono uppercase tracking-wider bg-[#10B981]/20 text-[#A7F3D0] border border-[#10B981]/40">
                <Cpu className="w-2.5 h-2.5" /> Nebius TokenFactory LLM
              </span>
            </div>
            <p className="text-[12px] text-[#A1A1AA] mt-0.5">
              Fetches live secondary-market pricing references &amp; repairability guides via{' '}
              <strong className="text-[#FFFFFF]">Tavily Search</strong> and synthesizes technician
              guidance with <strong className="text-[#FFFFFF]">Nebius TokenFactory</strong>. Human
              approval is required before updating{' '}
              <code className="font-mono text-[#C7D2FE]">v1.0.0</code> economics.
            </p>
          </div>
        </div>

        {!compact && allDevices.length > 0 && onSelectDevice && (
          <div className="flex items-center gap-2 shrink-0">
            <label htmlFor="research-device-picker" className="text-[11px] font-mono text-[#A1A1AA]">
              Queue Unit:
            </label>
            <select
              id="research-device-picker"
              value={device?.id || ''}
              onChange={(e) => onSelectDevice(e.target.value)}
              className="rounded-[6px] bg-[#18181B] border border-[#27272A] text-[12px] text-[#FFFFFF] px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
            >
              {allDevices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.assetTag} — {d.brand} {d.model}
                  {d.comparableValueCents === null ? ' (Missing Comp!)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Query & Controls Bar */}
      <div className="p-5 bg-[#FAFAFA] border-b border-[#E8E8EC]">
        <form onSubmit={handleRunResearch} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label
                htmlFor="research-brand"
                className="block text-[11px] font-mono uppercase text-[#6B6B6B] mb-1"
              >
                Brand
              </label>
              <input
                id="research-brand"
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Lenovo, Apple, Dell"
                className="w-full rounded-[6px] border border-[#E8E8EC] bg-[#FFFFFF] px-2.5 py-1.5 text-[12px] text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
              />
            </div>
            <div className="sm:col-span-1 lg:col-span-2">
              <label
                htmlFor="research-model"
                className="block text-[11px] font-mono uppercase text-[#6B6B6B] mb-1"
              >
                Model / Hardware Identifier
              </label>
              <input
                id="research-model"
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. ThinkPad T480, iPad 7th Gen"
                className="w-full rounded-[6px] border border-[#E8E8EC] bg-[#FFFFFF] px-2.5 py-1.5 text-[12px] text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
              />
            </div>
            <div>
              <label
                htmlFor="research-ram"
                className="block text-[11px] font-mono uppercase text-[#6B6B6B] mb-1"
              >
                RAM (GB)
              </label>
              <input
                id="research-ram"
                type="number"
                min={0}
                value={ramGb}
                onChange={(e) => setRamGb(e.target.value)}
                placeholder="e.g. 16"
                className="w-full rounded-[6px] border border-[#E8E8EC] bg-[#FFFFFF] px-2.5 py-1.5 text-[12px] font-mono text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
              />
            </div>
            <div>
              <label
                htmlFor="research-storage"
                className="block text-[11px] font-mono uppercase text-[#6B6B6B] mb-1"
              >
                Storage (GB)
              </label>
              <input
                id="research-storage"
                type="number"
                min={0}
                value={storageGb}
                onChange={(e) => setStorageGb(e.target.value)}
                placeholder="e.g. 256"
                className="w-full rounded-[6px] border border-[#E8E8EC] bg-[#FFFFFF] px-2.5 py-1.5 text-[12px] font-mono text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-[#6B6B6B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                aria-label="Optional technician research focus"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                placeholder="Optional focus: e.g., iFixit teardown difficulty, battery recall, or eBay refurbished comp..."
                className="w-full rounded-[6px] border border-[#E8E8EC] bg-[#FFFFFF] pl-8 pr-3 py-2 text-[12px] text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              data-testid="run-device-research-btn"
              className="genesis-btn-primary inline-flex items-center justify-center gap-2 px-4 py-2 text-[12px] font-semibold disabled:opacity-50 cursor-pointer shrink-0"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Searching Tavily &amp; Synthesizing via Nebius...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Run Live Web &amp; AI Bench Research
                </>
              )}
            </button>
          </div>
        </form>

        {/* Active device missing comp callout */}
        {device && device.comparableValueCents === null && !brief && (
          <div className="mt-3 p-3 rounded-[8px] bg-[#FEF3C7]/70 border border-[#F59E0B]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-[12px] text-[#92400E]">
              <span className="font-bold">Missing Comparable Market Value Detected:</span> Unit{' '}
              <span className="font-mono font-semibold">{device.assetTag}</span> ({device.brand}{' '}
              {device.model}) is currently held in{' '}
              <span className="font-mono font-semibold">INSUFFICIENT_DATA (MISSING_CRITICAL_INPUTS)</span>.
              Run live research to fetch secondary-market comps and unblock triage.
            </div>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-3 p-3 rounded-[8px] bg-[#FEE2E2] border border-[#EF4444]/40 text-[12px] text-[#991B1B] font-medium"
          >
            {error}
          </div>
        )}

        {appliedSuccess && (
          <div
            role="status"
            className="mt-3 p-3 rounded-[8px] bg-[#D1FAE5] border border-[#10B981]/40 text-[12px] text-[#065F46] font-medium flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
            <span>{appliedSuccess}</span>
          </div>
        )}
      </div>

      {/* Results Body */}
      {brief ? (
        <div className="p-5 space-y-5 bg-[#FFFFFF]" data-testid="device-research-results">
          {/* Provider Status & Executive Summary */}
          <div className="p-4 rounded-[10px] bg-[#FAFAFA] border border-[#E8E8EC] space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#4F46E5] font-semibold">
                Nebius TokenFactory Synthesis ({brief.providerStatus.nebiusModel})
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={`px-2 py-0.5 rounded-[4px] text-[10px] font-mono ${
                    brief.providerStatus.tavilyLive
                      ? 'bg-[#D1FAE5] text-[#065F46] border border-[#10B981]/30'
                      : 'bg-[#F4F4F6] text-[#6B6B6B]'
                  }`}
                >
                  {brief.providerStatus.tavilyLive
                    ? `Tavily Web Search: ${brief.citations.length} Live Sources`
                    : 'Tavily Offline / Cached'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-[4px] text-[10px] font-mono ${
                    brief.providerStatus.nebiusLive
                      ? 'bg-[#EEF2FF] text-[#4F46E5] border border-[#6366F1]/30'
                      : 'bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B]/30'
                  }`}
                >
                  {brief.providerStatus.nebiusLive ? 'Nebius LLM Live' : 'Deterministic Spec Fallback'}
                </span>
              </div>
            </div>
            <p className="text-[13px] text-[#0A0A0A] leading-relaxed">{brief.executiveSummary}</p>
            <p className="text-[12px] text-[#52525B] bg-[#FFFFFF] px-3 py-2 rounded-[6px] border border-[#E8E8EC]">
              <strong className="text-[#0A0A0A]">Community vs. Retail Fit:</strong>{' '}
              {brief.communityReuseFit}
            </p>
          </div>

          {/* Comparable Market Value Card + Human-in-the-Loop Action */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7 p-4 rounded-[10px] border border-[#E8E8EC] bg-[#FFFFFF] flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[12px] font-bold uppercase tracking-wider text-[#0A0A0A] flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-[#6366F1]" />
                    Advisory Secondary-Market Comparable Range
                  </span>
                  {device && (
                    <span className="text-[11px] font-mono text-[#6B6B6B]">
                      Current Recorded Comp:{' '}
                      <strong className="text-[#0A0A0A]">
                        {device.comparableValueCents !== null
                          ? formatCents(device.comparableValueCents)
                          : 'MISSING'}
                      </strong>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2.5 my-3">
                  <div className="p-2.5 rounded-[8px] bg-[#FAFAFA] border border-[#E8E8EC] text-center">
                    <div className="text-[10px] font-mono uppercase text-[#6B6B6B]">Conservative Low</div>
                    <div className="text-[16px] font-bold font-mono text-[#0A0A0A] mt-0.5">
                      ${brief.suggestedCompRangeDollars.low}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-[8px] bg-[#EEF2FF]/70 border-2 border-[#6366F1] text-center">
                    <div className="text-[10px] font-mono uppercase text-[#4F46E5] font-semibold">
                      Suggested Midpoint
                    </div>
                    <div className="text-[18px] font-bold font-mono text-[#4F46E5] mt-0.5">
                      ${brief.suggestedCompRangeDollars.mid}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-[8px] bg-[#FAFAFA] border border-[#E8E8EC] text-center">
                    <div className="text-[10px] font-mono uppercase text-[#6B6B6B]">Retail High</div>
                    <div className="text-[16px] font-bold font-mono text-[#0A0A0A] mt-0.5">
                      ${brief.suggestedCompRangeDollars.high}
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-[#6B6B6B]">{brief.suggestedCompRangeDollars.confidenceNote}</p>
              </div>

              {device && onApplySuggestedComp && actorRole !== 'viewer' && (
                <div className="pt-3 border-t border-[#E8E8EC] flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-[#6B6B6B]">
                    Human-in-the-Loop Action for <strong>{device.assetTag}</strong>:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={applyingComp}
                      onClick={() => handleApplyComp(brief.suggestedCompRangeDollars.mid, false)}
                      data-testid="apply-research-comp-btn"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[12px] font-semibold bg-[#0A0A0A] text-[#FFFFFF] hover:bg-[#27272A] disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      Apply ${brief.suggestedCompRangeDollars.mid} Comp &amp; Re-Evaluate v1.0.0
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Typical Parts & Bench Cost Notes */}
            <div className="lg:col-span-5 p-4 rounded-[10px] border border-[#E8E8EC] bg-[#FAFAFA] flex flex-col justify-between gap-3">
              <div>
                <div className="text-[12px] font-bold uppercase tracking-wider text-[#0A0A0A] flex items-center gap-1.5 mb-2">
                  <Wrench className="w-4 h-4 text-[#6366F1]" />
                  Parts &amp; Serviceability Reference
                </div>
                <div className="text-[12px] text-[#0A0A0A] space-y-2">
                  <div className="flex items-center justify-between py-1.5 border-b border-[#E8E8EC]">
                    <span className="text-[#6B6B6B]">Typical Bench Parts Budget:</span>
                    <span className="font-mono font-bold text-[#0A0A0A]">
                      ~${brief.estimatedPartsNotes.estimatedPartsCostDollars}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#52525B] leading-relaxed">
                    <strong className="text-[#0A0A0A]">Common Parts:</strong>{' '}
                    {brief.estimatedPartsNotes.typicalPartsNeeded}
                  </p>
                </div>
              </div>
              <div className="p-2.5 rounded-[6px] bg-[#FFFFFF] border border-[#E8E8EC] text-[11px] text-[#6B6B6B]">
                {brief.advisoryDisclaimer}
              </div>
            </div>
          </div>

          {/* Repairability & Safety Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-[10px] border border-[#E8E8EC] bg-[#FFFFFF]">
              <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#0A0A0A] flex items-center gap-1.5 mb-2.5">
                <BookOpen className="w-4 h-4 text-[#6366F1]" />
                Repairability &amp; Upgradeability Highlights
              </h4>
              <ul className="space-y-2 text-[12px] text-[#27272A]">
                {brief.repairabilityAndUpgradeNotes.map((note, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="font-mono font-bold text-[#6366F1] mt-0.5">0{idx + 1}.</span>
                    <span className="leading-relaxed">{note}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-[10px] border border-[#F59E0B]/40 bg-[#FEF3C7]/40">
              <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#92400E] flex items-center gap-1.5 mb-2.5">
                <ShieldAlert className="w-4 h-4 text-[#D97706]" />
                Safety &amp; Data Sanitization Guardrails
              </h4>
              <ul className="space-y-2 text-[12px] text-[#92400E]">
                {brief.safetyAndSanitizationChecklist.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="font-mono font-bold text-[#D97706] mt-0.5">•</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Live Web Citations from Tavily */}
          <div className="p-4 rounded-[10px] border border-[#E8E8EC] bg-[#FAFAFA]">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#0A0A0A] flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-[#6366F1]" />
                Live Web Citations (Tavily Search API)
              </h4>
              <span className="text-[11px] font-mono text-[#6B6B6B] truncate max-w-md">
                Query: &ldquo;{brief.queryExecuted}&rdquo;
              </span>
            </div>

            {brief.citations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {brief.citations.map((cite, idx) => (
                  <a
                    key={idx}
                    href={cite.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group p-3 rounded-[8px] bg-[#FFFFFF] border border-[#E8E8EC] hover:border-[#6366F1] transition-colors flex flex-col justify-between gap-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[12px] font-semibold text-[#0A0A0A] group-hover:text-[#4F46E5] line-clamp-1">
                        {cite.title}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-[#6B6B6B] group-hover:text-[#4F46E5] shrink-0 mt-0.5" />
                    </div>
                    <p className="text-[11px] text-[#52525B] line-clamp-2 leading-relaxed">
                      {cite.snippet || cite.url}
                    </p>
                    <span className="text-[10px] font-mono text-[#4F46E5] truncate">{cite.url}</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-[#6B6B6B]">
                No external web links returned for this query; displaying specification-based reference brief.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 bg-[#FFFFFF] text-[12px] text-[#6B6B6B] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            Click <strong className="text-[#0A0A0A]">Run Live Web &amp; AI Bench Research</strong> above
            to query <strong>Tavily Search</strong> for current refurbished market comps &amp; repair
            guides and generate a structured technician brief via <strong>Nebius TokenFactory</strong>.
          </div>
          <span className="text-[11px] font-mono text-[#4F46E5] shrink-0">
            100% Advisory • Human Approval Required
          </span>
        </div>
      )}
    </section>
  );
}
