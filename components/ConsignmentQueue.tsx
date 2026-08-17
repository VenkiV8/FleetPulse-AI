'use client';

import { Package, MapPin, ChevronRight, Clock, Truck, CheckCircle2 } from 'lucide-react';
import type { Consignment, ConsignmentStatus } from '@/lib/types';

interface ConsignmentQueueProps {
  consignments: Consignment[];
  selectedId: string;
  resolvedMap: Record<string, boolean>;
  onSelect: (id: string) => void;
}

function StatusBadge({ status, isResolved }: { status: ConsignmentStatus; isResolved: boolean }) {
  if (isResolved || status === 'MITIGATED') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold
                       bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.15)]">
        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
        MITIGATED
      </span>
    );
  }

  const config = {
    CRITICAL: {
      className: 'badge-critical',
      dot: 'bg-red-400 blink-dot',
      label: 'CRITICAL',
    },
    MONITORING: {
      className: 'badge-monitoring',
      dot: 'bg-amber-400',
      label: 'MONITORING',
    },
    'ON TRACK': {
      className: 'badge-ontrack',
      dot: 'bg-green-400',
      label: 'ON TRACK',
    },
    MITIGATED: {
      className: 'badge-ontrack',
      dot: 'bg-emerald-400',
      label: 'MITIGATED',
    },
  }[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold ${config.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
      {config.label}
    </span>
  );
}

function ConsignmentCard({
  consignment,
  isSelected,
  isResolved,
  onClick,
}: {
  consignment: Consignment;
  isSelected: boolean;
  isResolved: boolean;
  onClick: () => void;
}) {
  return (
    <button
      id={`consignment-${consignment.id}`}
      onClick={onClick}
      className={`consignment-row w-full text-left p-3.5 rounded-xl border cursor-pointer
        ${isSelected
          ? 'selected border-blue-500/30'
          : 'border-slate-800/70 hover:border-slate-700'
        } transition-all duration-200`}
      aria-pressed={isSelected}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0
            ${isResolved ? 'bg-green-950/40 border-green-800/40' : 'bg-slate-800 border-slate-700'}`}>
            {isResolved
              ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
              : <Truck className="w-3.5 h-3.5 text-slate-400" />
            }
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-100 font-mono leading-none">{consignment.id}</p>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-none truncate">{consignment.client}</p>
          </div>
        </div>
        <StatusBadge status={consignment.status} isResolved={isResolved} />
      </div>

      {/* Route */}
      <div className="flex items-center gap-1.5 mb-2">
        <MapPin className="w-3 h-3 text-slate-600 shrink-0" />
        <span className="text-xs text-slate-400 truncate">{consignment.route}</span>
      </div>

      {/* Cargo */}
      <div className="flex items-center gap-1.5 mb-2.5">
        <Package className="w-3 h-3 text-slate-600 shrink-0" />
        <span className="text-xs text-slate-500 truncate">{consignment.cargo}</span>
      </div>

      {/* Bottom Row */}
      <div className="flex items-center justify-between">
        {isResolved ? (
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-green-400" />
            <span className="text-xs font-medium text-green-400">Bypass Active</span>
          </div>
        ) : consignment.delay ? (
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-amber-500" />
            <span className="text-xs font-medium text-amber-400">{consignment.delay}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-600">ETA</span>
            <span className="text-xs font-medium text-slate-400">{consignment.telemetry.eta}</span>
          </div>
        )}
        <ChevronRight
          className={`w-3.5 h-3.5 transition-colors duration-200 ${isSelected ? 'text-blue-400' : 'text-slate-700'}`}
        />
      </div>
    </button>
  );
}

export default function ConsignmentQueue({
  consignments,
  selectedId,
  resolvedMap,
  onSelect,
}: ConsignmentQueueProps) {
  const criticalCount = consignments.filter(
    (c) => c.status === 'CRITICAL' && !resolvedMap[c.id]
  ).length;
  const resolvedCount = Object.values(resolvedMap).filter(Boolean).length;

  return (
    <aside className="flex flex-col h-full">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/70">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Active Consignments</h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {consignments.length} tracked ·{' '}
            {criticalCount > 0 ? (
              <span className="text-red-400">{criticalCount} critical</span>
            ) : (
              <span className="text-green-400">all clear</span>
            )}
            {resolvedCount > 0 && (
              <> · <span className="text-green-400">{resolvedCount} resolved</span></>
            )}
          </p>
        </div>
        <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
          <span className="text-[10px] font-bold text-slate-300">{consignments.length}</span>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
        {consignments.map((c) => (
          <ConsignmentCard
            key={c.id}
            consignment={c}
            isSelected={selectedId === c.id}
            isResolved={resolvedMap[c.id] ?? false}
            onClick={() => onSelect(c.id)}
          />
        ))}
      </div>
    </aside>
  );
}
