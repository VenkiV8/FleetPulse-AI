'use client';

import dynamic from 'next/dynamic';
import TelemetryCard from './TelemetryCard';
import type { Consignment } from '@/lib/types';
import { Map, CheckCircle2, AlertTriangle, RotateCcw } from 'lucide-react';

// ── Dynamically import Leaflet Map (SSR disabled) ─────────────────────────
const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 rounded-full border-2 border-blue-500/40 border-t-blue-500 animate-spin" />
      <p className="text-xs text-slate-500">Initialising Map…</p>
    </div>
  ),
});

interface MapPanelProps {
  consignment: Consignment;
  isResolved: boolean;
  onToggleResolution: () => void;
}

export default function MapPanel({ consignment, isResolved, onToggleResolution }: MapPanelProps) {
  const isCriticalOrMonitoring =
    consignment.status === 'CRITICAL' || consignment.status === 'MONITORING';

  // Displayed telemetry switches to resolved values on resolution
  const displayTelemetry = isResolved ? consignment.resolvedTelemetry : consignment.telemetry;

  return (
    <section className="flex flex-col h-full">
      {/* ── Panel Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/70 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Map className="w-4 h-4 text-blue-400 shrink-0" />
          <h2 className="text-sm font-semibold text-slate-100 whitespace-nowrap">Live Route & Telemetry</h2>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Route Legend */}
          <div className="hidden sm:flex items-center gap-3 text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-slate-600 rounded" />
              Travelled
            </span>
            {!isResolved ? (
              <>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-red-500 rounded" style={{ backgroundImage: 'repeating-linear-gradient(90deg,#ef4444 0,#ef4444 4px,transparent 4px,transparent 8px)' }} />
                  Blocked
                </span>
                {isCriticalOrMonitoring && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-400 opacity-80" />
                    Hazard Zone
                  </span>
                )}
              </>
            ) : (
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-green-400 rounded" />
                Bypass
              </span>
            )}
          </div>

          {/* Truck ID chip */}
          <div className="px-2 py-1 rounded-md bg-slate-800/80 border border-slate-700/50 text-[10px] text-slate-400 font-mono shrink-0">
            {consignment.id}
          </div>

          {/* ── Simulate Incident Resolution toggle ── */}
          {isCriticalOrMonitoring && (
            <button
              id="toggle-incident-resolution-btn"
              onClick={onToggleResolution}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                border transition-all duration-200 whitespace-nowrap
                ${isResolved
                  ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                }
              `}
              aria-pressed={isResolved}
              title={isResolved ? 'Click to restore incident state' : 'Simulate incident resolution — activates bypass route'}
            >
              {isResolved ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Incident Resolved</span>
                  <span className="sm:hidden">Resolved</span>
                  <RotateCcw className="w-3 h-3 ml-0.5 opacity-60" />
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Simulate Resolution</span>
                  <span className="sm:hidden">Resolve</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── Resolution Banner ── */}
      {isResolved && isCriticalOrMonitoring && (
        <div className="mx-3 mt-2 px-3 py-2 rounded-lg bg-green-950/50 border border-green-800/40 flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          <p className="text-xs text-green-300 leading-snug flex-1">
            <span className="font-semibold">Bypass Activated.</span>{' '}
            Green route is now live on map — incident corridor cleared.
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-green-600 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 blink-dot" />
            Live
          </div>
        </div>
      )}

      {/* ── Map Container ── */}
      <div className="flex-1 min-h-0 p-3">
        <div className="w-full h-72 lg:h-full min-h-[280px] rounded-xl overflow-hidden border border-slate-800/70">
          <LeafletMap consignment={consignment} isResolved={isResolved} />
        </div>
      </div>

      {/* ── Telemetry Card ── */}
      <TelemetryCard
        telemetry={displayTelemetry}
        truckId={consignment.id}
        route={consignment.route}
        isResolved={isResolved}
      />
    </section>
  );
}
