'use client';

import { useState, useEffect } from 'react';
import { Truck, TrendingUp, AlertOctagon, ShieldCheck, Sparkles } from 'lucide-react';
import type { KPIData } from '@/lib/types';

interface KPIBarProps {
  data: KPIData;
  extraSavingsInr?: number;
  isHighlighted?: boolean;
}

function formatInrLakhs(baseStr: string, extraInr: number): string {
  if (!extraInr || extraInr === 0) return baseStr;
  const numericMatch = baseStr.match(/[\d.]+/);
  const baseLakhs = numericMatch ? parseFloat(numericMatch[0]) : 4.2;
  const extraLakhs = extraInr / 100000;
  const total = (baseLakhs + extraLakhs).toFixed(1);
  return `₹${total}L`;
}

export default function KPIBar({ data, extraSavingsInr = 0, isHighlighted = false }: KPIBarProps) {
  const [pulsing, setPulsing] = useState(false);

  useEffect(() => {
    if (isHighlighted || extraSavingsInr > 0) {
      setPulsing(true);
      const timer = setTimeout(() => setPulsing(false), 2400);
      return () => clearTimeout(timer);
    }
  }, [extraSavingsInr, isHighlighted]);

  const displayedAvoided = formatInrLakhs(data.avoidedPenalties, extraSavingsInr);

  const pills = [
    {
      id: 'kpi-active-trucks',
      label: 'Active',
      value: String(data.activeTrucks),
      icon: <Truck className="w-3 h-3" />,
      valueColor: 'text-slate-100',
      iconColor: 'text-blue-400',
    },
    {
      id: 'kpi-fleet-otif',
      label: 'OTIF',
      value: data.fleetOTIF,
      icon: <TrendingUp className="w-3 h-3" />,
      valueColor: 'text-emerald-400',
      iconColor: 'text-emerald-400',
    },
    {
      id: 'kpi-at-risk',
      label: 'At-Risk',
      value: String(data.atRiskConsignments),
      icon: <AlertOctagon className="w-3 h-3" />,
      valueColor: 'text-red-400',
      iconColor: 'text-red-400',
    },
    {
      id: 'kpi-avoided-penalties',
      label: 'Saved',
      value: displayedAvoided,
      icon: <ShieldCheck className="w-3 h-3" />,
      valueColor: extraSavingsInr > 0 ? 'text-emerald-300' : 'text-cyan-400',
      iconColor: extraSavingsInr > 0 ? 'text-emerald-400' : 'text-cyan-400',
      isSpecial: true,
    },
  ];

  return (
    <div className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-sm">
      <div className="px-4 lg:px-6 py-2">
        <div className="flex items-center gap-0 flex-wrap">
          {pills.map((pill, i) => (
            <div key={pill.id} className="flex items-center">
              {/* Pill */}
              <div
                id={pill.id}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 cursor-default
                  ${pill.isSpecial && pulsing
                    ? 'bg-emerald-950/60 border border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)] scale-[1.03]'
                    : pill.isSpecial && extraSavingsInr > 0
                    ? 'bg-slate-900/80 border border-emerald-500/25'
                    : 'bg-transparent border border-transparent'
                  }`}
              >
                <span className={pill.iconColor}>{pill.icon}</span>
                <span className="text-slate-500 text-[10px] font-normal">{pill.label}:</span>
                <span className={`font-bold tabular-nums ${pill.valueColor}`}>{pill.value}</span>
                {pill.isSpecial && extraSavingsInr > 0 && (
                  <span className="flex items-center gap-0.5 text-[9px] font-semibold text-emerald-400 animate-pulse ml-0.5">
                    <Sparkles className="w-2.5 h-2.5" />
                    AI
                  </span>
                )}
              </div>

              {/* Separator */}
              {i < pills.length - 1 && (
                <span className="text-slate-700 text-xs mx-0.5 select-none">|</span>
              )}
            </div>
          ))}

          {/* Live status dot — right side */}
          <div className="ml-auto flex items-center gap-1.5 text-[10px] text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 blink-dot shrink-0" />
            <span>Live</span>
          </div>
        </div>
      </div>
    </div>
  );
}
