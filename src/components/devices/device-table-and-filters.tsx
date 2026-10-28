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
    return <Laptop className="h-4 w-4 text-stone-600 shrink-0" aria-hidden="true" />;
  }
  if (category === 'desktop') {
    return <Monitor className="h-4 w-4 text-stone-600 shrink-0" aria-hidden="true" />;
  }
  return <Tablet className="h-4 w-4 text-stone-600 shrink-0" aria-hidden="true" />;
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
      className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 px-3 py-2 text-xs font-medium text-stone-700 transition-colors disabled:opacity-50 cursor-pointer"
    >
      <Download className="h-3.5 w-3.5" aria-hidden="true" />
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
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label htmlFor="filter-search" className="block text-xs font-medium text-stone-600 mb-1">
            Search Asset Tag / Model
          </label>
          <div className="relative">
            <Search
              className="h-4 w-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              id="filter-search"
              type="search"
              value={filters.search ?? ''}
              onChange={(e) => onChange({ ...filters, search: e.target.value })}
              placeholder="e.g., FG-DEMO-101 or ThinkPad"
              className="w-full rounded-lg border border-stone-300 pl-9 pr-3 py-1.5 text-sm text-stone-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="filter-category"
            className="block text-xs font-medium text-stone-600 mb-1"
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
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
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
            className="block text-xs font-medium text-stone-600 mb-1"
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
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
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
            className="block text-xs font-medium text-stone-600 mb-1"
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
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
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

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100 text-xs text-stone-600">
        <span>
          Showing <strong>{filteredCount}</strong> of <strong>{totalCount}</strong> devices
        </span>
        <div className="flex items-center gap-2">
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
              className="text-xs font-medium text-teal-800 hover:underline cursor-pointer"
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
    <div className="rounded-xl border border-stone-200 bg-white shadow-2xs overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50 text-[11px] font-bold uppercase tracking-wider text-stone-600">
              <th className="py-3 px-4">Asset & Hardware</th>
              <th className="py-3 px-4">Specs & Condition</th>
              <th className="py-3 px-4">Recommended Action</th>
              <th className="py-3 px-4">Repair Cost / Margin</th>
              <th className="py-3 px-4">Sanitization Gate</th>
              <th className="py-3 px-4">Workflow Status</th>
              <th className="py-3 px-4 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 text-sm">
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
                      ? 'bg-teal-50/70 hover:bg-teal-50'
                      : 'hover:bg-stone-50/80'
                  )}
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <CategoryIcon category={device.category} />
                      <div>
                        <p className="font-mono text-xs font-bold text-teal-900">
                          {device.assetTag}
                        </p>
                        <p className="font-medium text-stone-900">
                          {device.brand} {device.model}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-xs text-stone-700">
                    <p>
                      {device.ramGb !== null ? `${device.ramGb} GB RAM` : 'RAM ?'} ·{' '}
                      {device.storagePresent
                        ? `${device.storageGb ?? '?'} GB Drive`
                        : 'No Drive'}
                    </p>
                    <p className="text-stone-500 capitalize mt-0.5">
                      Cond: {device.condition} · Battery:{' '}
                      <span
                        className={
                          device.batterySafety === 'swollen'
                            ? 'font-bold text-amber-800'
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

                  <td className="py-3.5 px-4 text-xs">
                    {latest && latest.repairCostCents !== null ? (
                      <div>
                        <p className="text-stone-700">
                          Cost: <strong>{formatCents(latest.repairCostCents)}</strong>
                        </p>
                        <p
                          className={cn(
                            'font-semibold mt-0.5',
                            (latest.marginCents ?? 0) < 0
                              ? 'text-red-700'
                              : (latest.marginCents ?? 0) >= 2000
                                ? 'text-emerald-800'
                                : 'text-amber-800'
                          )}
                        >
                          Margin: {formatCents(latest.marginCents)}
                        </p>
                      </div>
                    ) : (
                      <span className="text-stone-400">—</span>
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
                        'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer',
                        isSelected
                          ? 'bg-teal-800 text-white'
                          : 'bg-stone-100 text-stone-800 hover:bg-stone-200'
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
      <div className="md:hidden divide-y divide-stone-200">
        {devices.map((device) => {
          const isSelected = device.id === selectedDeviceId;
          const latest = device.latestAssessment;

          return (
            <div
              key={device.id}
              onClick={() => onSelectDevice(device)}
              className={cn(
                'p-4 space-y-2.5 transition-colors cursor-pointer',
                isSelected ? 'bg-teal-50/70' : 'bg-white hover:bg-stone-50'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CategoryIcon category={device.category} />
                  <div>
                    <p className="font-mono text-xs font-bold text-teal-900">
                      {device.assetTag}
                    </p>
                    <p className="text-sm font-semibold text-stone-900">
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

              <div className="flex items-center justify-between text-xs text-stone-600 pt-1">
                <span>
                  Cost: <strong>{formatCents(latest?.repairCostCents)}</strong> · Margin:{' '}
                  <strong>{formatCents(latest?.marginCents)}</strong>
                </span>
                <span className="font-semibold text-teal-800">
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
