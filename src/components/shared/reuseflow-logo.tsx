import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Custom SVG Brand Mark for ReuseFlow
 * Combines a circular refurbishment lifecycle loop with a precision silicon core node
 * and a human-verified check accent.
 */
export function ReuseFlowMark({
  className = 'h-9 w-9',
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0 select-none', className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="rf-bg-grad"
          x1="0"
          y1="0"
          x2="40"
          y2="40"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#1E1B4B" />
        </linearGradient>
        <linearGradient
          id="rf-loop-indigo"
          x1="6"
          y1="8"
          x2="34"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
        <linearGradient
          id="rf-loop-emerald"
          x1="8"
          y1="32"
          x2="34"
          y2="10"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>

      {/* Outer Rounded Squircle Badge */}
      <rect
        x="1"
        y="1"
        width="38"
        height="38"
        rx="10"
        fill="url(#rf-bg-grad)"
        stroke="#312E81"
        strokeWidth="1.5"
      />

      {/* Subtle Inner Grid Accent */}
      <rect
        x="5"
        y="5"
        width="30"
        height="30"
        rx="7"
        stroke="#FFFFFF"
        strokeOpacity="0.07"
        strokeWidth="1"
      />

      {/* Upper Circular Refurbishment Flow Arc (Indigo) */}
      <path
        d="M11.5 18.5C12.3 13.4 16.7 9.5 22 9.5C25.9 9.5 29.3 11.6 31.1 14.8"
        stroke="url(#rf-loop-indigo)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M27.6 15.2L31.5 15.4L31.9 11.5"
        stroke="#818CF8"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Lower Circular Value Recovery Arc (Emerald) */}
      <path
        d="M28.5 21.5C27.7 26.6 23.3 30.5 18 30.5C14.1 30.5 10.7 28.4 8.9 25.2"
        stroke="url(#rf-loop-emerald)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M12.4 24.8L8.5 24.6L8.1 28.5"
        stroke="#34D399"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Central Hardware Core Chip */}
      <rect
        x="15.5"
        y="15.5"
        width="9"
        height="9"
        rx="2.2"
        fill="#0F172A"
        stroke="#E0E7FF"
        strokeWidth="1.6"
      />
      <circle cx="20" cy="20" r="1.8" fill="#10B981" />
    </svg>
  );
}

export function ReuseFlowLogo({
  subtitle,
  showVersion = false,
  size = 'md',
  className,
}: {
  subtitle?: string;
  showVersion?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const markSize =
    size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-10 w-10' : 'h-9 w-9';
  const titleSize =
    size === 'sm'
      ? 'text-[17px]'
      : size === 'lg'
        ? 'text-[21px]'
        : 'text-[19px]';

  return (
    <div className={cn('inline-flex items-center gap-3', className)}>
      <ReuseFlowMark className={markSize} />
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-2 leading-none">
          <span
            className={cn(
              'font-display font-bold tracking-[-0.03em] text-[#0A0A0A]',
              titleSize
            )}
          >
            Reuse<span className="text-[#4F46E5]">Flow</span>
          </span>
          {showVersion && (
            <span className="rounded-[5px] bg-[#EEF2FF] border border-[#C7D2FE] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#4338CA]">
              v1.0.0
            </span>
          )}
        </div>
        {subtitle && (
          <span className="mt-0.5 text-[11px] font-medium text-[#6B6B6B] leading-tight">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
