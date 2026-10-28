'use client';

import React from 'react';
import {
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

    const escapeCsv = (val: string | number | boolean | null | undefined) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

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
      ...rows.map((r) => r.map(escapeCsv).join(',')),
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
  return (
    <div className="genesis-card p-5 space-y-4">
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
            {devices.map((device) => {
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
        {devices.map((device) => {
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
