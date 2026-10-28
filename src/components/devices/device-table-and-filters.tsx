'use client';

import React, { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  Download,
  Laptop,
  Monitor,
  Search,
  Tablet,
} from 'lucide-react';
import {
  Decision,
  Device,
  DeviceCategory,
  DeviceFilters as FilterState,
  WorkflowStatus,
} from '@/types/domain';
import { formatCents } from '@/lib/decision/engine';
import {
  DecisionBadge,
  EmptyState,
  SanitizationBadge,
  WorkflowStatusBadge,
} from '@/components/shared/badges-and-banners';
import { cn } from '@/lib/utils';

export type QueueSortOrder =
  | 'updated_desc'
  | 'margin_desc'
  | 'cost_asc'
  | 'asset_asc';

/**
 * Pure CSV cell formatter with OWASP CSV formula injection neutralization.
 * Prefixes non-numeric strings starting with =, +, -, or @ with a leading apostrophe (').
 */
export function escapeCsvCell(
  val: string | number | boolean | null | undefined
): string {
  if (val === null || val === undefined) return '';
  let str = String(val);
  const isStrictNumber = /^-?\d+(\.\d+)?$/.test(str);
  if (!isStrictNumber && /^[=+\-@]/.test(str)) {
    str = `'${str}`;
  }
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function CategoryIcon({ category }: { category: DeviceCategory }) {
  if (category === 'laptop') {
    return <Laptop className="h-4 w-4 text-[#6B6B6B] shrink-0" aria-hidden="true" />;
  }
  if (category === 'desktop') {
    return <Monitor className="h-4 w-4 text-[#6B6B6B] shrink-0" aria-hidden="true" />;
  }
  return <Tablet className="h-4 w-4 text-[#6B6B6B] shrink-0" aria-hidden="true" />;
}

export function CsvExportButton({
  devices,
  isDemo,
}: {
  devices: Device[];
  isDemo: boolean;
}) {
  const handleExport = () => {
    const headers = [
      'Data_Classification',
      'Asset_Tag',
      'Category',
      'Brand',
      'Model',
      'RAM_GB',
      'Storage_GB',
      'Boots',
      'Condition',
      'Battery_Safety',
      'Storage_Present',
      'Sanitization_Status',
      'Decision_Recommendation',
      'Rule_Version',
      'Repair_Cost_Dollars',
      'Comparable_Value_Dollars',
      'Net_Margin_Dollars',
      'Workflow_Status',
    ];

    const rows = devices.map((d) => [
      isDemo ? 'FICTIONAL_SAMPLE_DEMO_DATA' : 'INTERNAL_OPERATIONS_RECORD',
      d.assetTag,
      d.category,
      d.brand,
      d.model,
      d.ramGb ?? '',
      d.storageGb ?? '',
      d.boots ?? '',
      d.condition,
      d.batterySafety,
      d.storagePresent,
      d.sanitizationStatus,
      d.latestAssessment?.decision ?? 'UNASSESSED',
      d.latestAssessment?.ruleVersion ?? '1.0.0',
      d.latestAssessment?.repairCostCents !== null &&
      d.latestAssessment?.repairCostCents !== undefined
        ? (d.latestAssessment.repairCostCents / 100).toFixed(2)
        : '',
      d.comparableValueCents !== null ? (d.comparableValueCents / 100).toFixed(2) : '',
      d.latestAssessment?.marginCents !== null &&
      d.latestAssessment?.marginCents !== undefined
        ? (d.latestAssessment.marginCents / 100).toFixed(2)
        : '',
      d.status,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((r) => r.map(escapeCsvCell).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      isDemo
        ? 'reuseflow-fictional-sample-inventory.csv'
        : 'reuseflow-inventory-export.csv'
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={devices.length === 0}
      className="genesis-btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] disabled:opacity-50 cursor-pointer"
    >
      <Download className="h-3.5 w-3.5 text-[#6B6B6B]" aria-hidden="true" />
      {isDemo ? 'Export Sample CSV' : 'Export CSV'}
    </button>
  );
}

export function DeviceFiltersBar({
  filters,
  onChange,
  totalCount,
  filteredCount,
  rightSlot,
}: {
  filters: FilterState;
  onChange: (next: FilterState) => void;
  totalCount: number;
  filteredCount: number;
  rightSlot?: React.ReactNode;
}) {
  const quickDecisionPills: Array<{ label: string; decision: Decision | 'all' }> = [
    { label: 'All Recommendations', decision: 'all' },
    { label: 'Viable Refurb', decision: 'REFURBISH_CANDIDATE' },
    { label: 'Missing Data', decision: 'INSUFFICIENT_DATA' },
    { label: 'Safety Quarantine', decision: 'QUARANTINE' },
    { label: 'Review Required', decision: 'REVIEW_REQUIRED' },
    { label: 'Recycle Review', decision: 'RECYCLE_REVIEW' },
  ];

  return (
    <div className="genesis-card p-5 space-y-4">
      {/* 1-Click Quick Decision Filter Pills */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E8E8EC]">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B] mr-1">
            Quick Triage Filter:
          </span>
          {quickDecisionPills.map((pill) => {
            const isActive = (filters.decision ?? 'all') === pill.decision;
            return (
              <button
                key={pill.decision}
                type="button"
                onClick={() => onChange({ ...filters, decision: pill.decision })}
                className={cn(
                  'rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer',
                  isActive
                    ? 'bg-[#0A0A0A] text-[#FFFFFF]'
                    : 'bg-[#F4F4F6] text-[#6B6B6B] hover:bg-[#E8E8EC] hover:text-[#0A0A0A]'
                )}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label
            htmlFor="filter-search"
            className="block text-[12px] font-medium text-[#6B6B6B] mb-1.5"
          >
            Search Asset Tag / Model
          </label>
          <div className="relative">
            <Search
              className="h-4 w-4 text-[#9C9C9C] absolute left-3.5 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              id="filter-search"
              type="search"
              value={filters.search ?? ''}
              onChange={(e) => onChange({ ...filters, search: e.target.value })}
              placeholder="e.g., FG-DEMO-101 or ThinkPad"
              className="genesis-input w-full pl-9"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="filter-category"
            className="block text-[12px] font-medium text-[#6B6B6B] mb-1.5"
          >
            Category
          </label>
          <select
            id="filter-category"
            value={filters.category ?? 'all'}
            onChange={(e) =>
              onChange({
                ...filters,
                category: e.target.value as DeviceCategory | 'all',
              })
            }
            className="genesis-input w-full"
          >
            <option value="all">All Categories</option>
            <option value="laptop">Laptops</option>
            <option value="desktop">Desktops</option>
            <option value="tablet">Tablets</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="filter-decision"
            className="block text-[12px] font-medium text-[#6B6B6B] mb-1.5"
          >
            Recommended Decision
          </label>
          <select
            id="filter-decision"
            value={filters.decision ?? 'all'}
            onChange={(e) =>
              onChange({
                ...filters,
                decision: e.target.value as Decision | 'all',
              })
            }
            className="genesis-input w-full"
          >
            <option value="all">All Recommendations</option>
            <option value="REFURBISH_CANDIDATE">Refurbish Candidate</option>
            <option value="REVIEW_REQUIRED">Review Required</option>
            <option value="RECYCLE_REVIEW">Recycle Review</option>
            <option value="QUARANTINE">Safety Quarantine</option>
            <option value="INSUFFICIENT_DATA">Insufficient Data</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="filter-status"
            className="block text-[12px] font-medium text-[#6B6B6B] mb-1.5"
          >
            Workflow Status
          </label>
          <select
            id="filter-status"
            value={filters.status ?? 'all'}
            onChange={(e) =>
              onChange({
                ...filters,
                status: e.target.value as WorkflowStatus | 'all',
              })
            }
            className="genesis-input w-full"
          >
            <option value="all">All Workflow States</option>
            <option value="intake">Intake Draft</option>
            <option value="assessed">Assessed (Awaiting Approval)</option>
            <option value="approved_refurb">Approved for Refurb</option>
            <option value="repairing">In Bench Repair</option>
            <option value="ready">Ready for Distribution</option>
            <option value="recycle_review">In Recycle Review</option>
            <option value="quarantined">Quarantined (Hazard)</option>
            <option value="closed">Closed / Finalized</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#E8E8EC] text-[12px] text-[#6B6B6B]">
        <span>
          Showing <span className="font-medium text-[#0A0A0A]">{filteredCount}</span> of{' '}
          <span className="font-medium text-[#0A0A0A]">{totalCount}</span> devices
        </span>
        <div className="flex items-center gap-3">
          {(filters.search ||
            (filters.category && filters.category !== 'all') ||
            (filters.decision && filters.decision !== 'all') ||
            (filters.status && filters.status !== 'all')) && (
            <button
              type="button"
              onClick={() =>
                onChange({
                  search: '',
                  category: 'all',
                  decision: 'all',
                  status: 'all',
                })
              }
              className="text-[12px] font-medium text-[#6366F1] hover:text-[#4F46E5] underline cursor-pointer"
            >
              Clear filters
            </button>
          )}
          {rightSlot}
        </div>
      </div>
    </div>
  );
}

export function DeviceTable({
  devices,
  selectedDeviceId,
  onSelectDevice,
}: {
  devices: Device[];
  selectedDeviceId?: string | null;
  onSelectDevice: (device: Device) => void;
}) {
  const [sortOrder, setSortOrder] = useState<QueueSortOrder>('updated_desc');

  const sortedDevices = useMemo(() => {
    const copy = [...devices];
    copy.sort((a, b) => {
      if (sortOrder === 'margin_desc') {
        const ma = a.latestAssessment?.marginCents ?? -9999999;
        const mb = b.latestAssessment?.marginCents ?? -9999999;
        return mb - ma;
      }
      if (sortOrder === 'cost_asc') {
        const ca = a.latestAssessment?.repairCostCents ?? 9999999;
        const cb = b.latestAssessment?.repairCostCents ?? 9999999;
        return ca - cb;
      }
      if (sortOrder === 'asset_asc') {
        return a.assetTag.localeCompare(b.assetTag);
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    return copy;
  }, [devices, sortOrder]);

  if (devices.length === 0) {
    return (
      <EmptyState
        title="No devices match your current filters"
        description="Clear search filters or click 'New Device Intake' to evaluate a donated laptop, desktop, or tablet."
      />
    );
  }

  return (
    <div className="genesis-card overflow-hidden">
      {/* Table Header Bar with Sort Selector */}
      <div className="px-4 py-2.5 border-b border-[#E8E8EC] bg-[#FFFFFF] flex flex-wrap items-center justify-between gap-2">
        <span className="text-[12px] font-semibold text-[#0A0A0A]">
          Active Triage Queue ({sortedDevices.length} {sortedDevices.length === 1 ? 'unit' : 'units'})
        </span>
        <div className="flex items-center gap-2 text-[12px]">
          <ArrowUpDown className="h-3.5 w-3.5 text-[#6366F1]" aria-hidden="true" />
          <label htmlFor="queue-sort-select" className="text-[#6B6B6B]">
            Sort Queue:
          </label>
          <select
            id="queue-sort-select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as QueueSortOrder)}
            className="rounded-[6px] border border-[#E8E8EC] bg-[#FAFAFA] px-2.5 py-1 text-[12px] font-medium text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
          >
            <option value="updated_desc">Recently Updated</option>
            <option value="margin_desc">Highest Net Margin First</option>
            <option value="cost_asc">Lowest Repair Cost First</option>
            <option value="asset_asc">Asset Tag (A–Z)</option>
          </select>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E8E8EC] bg-[#FAFAFA] text-[11px] font-medium uppercase tracking-wider text-[#6B6B6B]">
              <th className="py-3 px-4">Asset & Hardware</th>
              <th className="py-3 px-4">Specs & Condition</th>
              <th className="py-3 px-4">Recommended Action</th>
              <th className="py-3 px-4">Repair Cost / Margin</th>
              <th className="py-3 px-4">Sanitization Gate</th>
              <th className="py-3 px-4">Workflow Status</th>
              <th className="py-3 px-4 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E8EC] text-[14px]">
            {sortedDevices.map((device) => {
              const isSelected = device.id === selectedDeviceId;
              const latest = device.latestAssessment;

              return (
                <tr
                  key={device.id}
                  onClick={() => onSelectDevice(device)}
                  className={cn(
                    'transition-colors cursor-pointer',
                    isSelected
                      ? 'bg-[#6366F1]/6 hover:bg-[#6366F1]/10'
                      : 'hover:bg-[#FAFAFA]'
                  )}
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <CategoryIcon category={device.category} />
                      <div>
                        <p className="font-mono text-[12px] font-medium text-[#6B6B6B]">
                          {device.assetTag}
                        </p>
                        <p className="font-medium text-[#0A0A0A]">
                          {device.brand} {device.model}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-[12px] text-[#6B6B6B]">
                    <p className="text-[#0A0A0A]">
                      {device.ramGb !== null ? `${device.ramGb} GB RAM` : 'RAM ?'} ·{' '}
                      {device.storagePresent
                        ? `${device.storageGb ?? '?'} GB Drive`
                        : 'No Drive'}
                    </p>
                    <p className="text-[#9C9C9C] capitalize mt-0.5">
                      Cond: {device.condition} · Battery:{' '}
                      <span
                        className={
                          device.batterySafety === 'swollen'
                            ? 'font-medium text-[#F59E0B]'
                            : ''
                        }
                      >
                        {device.batterySafety.replace('_', ' ')}
                      </span>
                    </p>
                  </td>

                  <td className="py-3.5 px-4">
                    <DecisionBadge decision={latest?.decision} />
                  </td>

                  <td className="py-3.5 px-4 text-[12px] font-mono">
                    {latest && latest.repairCostCents !== null ? (
                      <div>
                        <p className="text-[#6B6B6B]">
                          Cost:{' '}
                          <span className="text-[#0A0A0A]">
                            {formatCents(latest.repairCostCents)}
                          </span>
                        </p>
                        <p
                          className={cn(
                            'font-medium mt-0.5',
                            (latest.marginCents ?? 0) < 0
                              ? 'text-[#EF4444]'
                              : (latest.marginCents ?? 0) >= 2000
                                ? 'text-[#10B981]'
                                : 'text-[#F59E0B]'
                          )}
                        >
                          Margin: {formatCents(latest.marginCents)}
                        </p>
                      </div>
                    ) : (
                      <span className="text-[#9C9C9C]">—</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <SanitizationBadge
                      storagePresent={device.storagePresent}
                      status={device.sanitizationStatus}
                      compact
                    />
                  </td>

                  <td className="py-3.5 px-4">
                    <WorkflowStatusBadge status={device.status} />
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDevice(device);
                      }}
                      className={cn(
                        'rounded-full px-3 py-1 text-[12px] font-medium transition-colors cursor-pointer',
                        isSelected
                          ? 'bg-[#6366F1] text-[#FAFAFA]'
                          : 'bg-[#F4F4F6] text-[#6B6B6B] hover:text-[#0A0A0A]'
                      )}
                    >
                      {isSelected ? 'Selected' : 'Inspect'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Cards (375px safe, zero horizontal overflow) */}
      <div className="md:hidden divide-y divide-[#E8E8EC]">
        {sortedDevices.map((device) => {
          const isSelected = device.id === selectedDeviceId;
          const latest = device.latestAssessment;

          return (
            <div
              key={device.id}
              onClick={() => onSelectDevice(device)}
              className={cn(
                'p-4 space-y-2.5 transition-colors cursor-pointer',
                isSelected ? 'bg-[#6366F1]/6' : 'bg-[#FFFFFF] hover:bg-[#FAFAFA]'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CategoryIcon category={device.category} />
                  <div>
                    <p className="font-mono text-[12px] text-[#6B6B6B]">
                      {device.assetTag}
                    </p>
                    <p className="text-[14px] font-medium text-[#0A0A0A]">
                      {device.brand} {device.model}
                    </p>
                  </div>
                </div>
                <WorkflowStatusBadge status={device.status} />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <DecisionBadge decision={latest?.decision} />
                <SanitizationBadge
                  storagePresent={device.storagePresent}
                  status={device.sanitizationStatus}
                  compact
                />
              </div>

              <div className="flex items-center justify-between text-[12px] text-[#6B6B6B] pt-1">
                <span className="font-mono">
                  Cost: {formatCents(latest?.repairCostCents)} · Margin:{' '}
                  {formatCents(latest?.marginCents)}
                </span>
                <span className="font-medium text-[#6366F1]">
                  {isSelected ? 'Active ↓' : 'Tap to inspect →'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
