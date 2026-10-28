import React from 'react';
import { ReuseFlowLogo } from '@/components/shared/reuseflow-logo';

export default function AppLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F7] text-[#1D1D1F]">
      <header className="sticky top-0 z-30 border-b border-black/[0.08] bg-white/80 backdrop-blur-2xl">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-[60px] flex items-center justify-between">
          <ReuseFlowLogo
            size="sm"
            showVersion
            subtitle="Loading Authenticated Operations Workspace (/app)..."
          />
          <div className="flex items-center gap-2">
            <div className="h-8 w-28 rounded-full bg-black/[0.06] animate-pulse" />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              className="rounded-2xl bg-white border border-black/[0.06] p-5 shadow-xs space-y-3"
            >
              <div className="h-3 w-24 rounded-full bg-black/[0.06] animate-pulse" />
              <div className="h-7 w-16 rounded-lg bg-black/[0.08] animate-pulse" />
              <div className="h-2.5 w-32 rounded-full bg-black/[0.05] animate-pulse" />
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-white border border-black/[0.06] p-6 shadow-xs space-y-4">
          <div className="h-5 w-64 rounded-lg bg-black/[0.08] animate-pulse" />
          {[1, 2, 3, 4].map((row) => (
            <div
              key={row}
              className="h-12 w-full rounded-xl bg-[#F5F5F7] animate-pulse"
            />
          ))}
        </div>
      </main>
    </div>
  );
}
