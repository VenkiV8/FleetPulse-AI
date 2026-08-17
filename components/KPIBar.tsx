'use client';

import { useState, useEffect } from 'react';
import { Truck, TrendingUp, AlertOctagon, IndianRupee, ShieldCheck, Sparkles } from 'lucide-react';
import type { KPIData } from '@/lib/types';

interface KPIBarProps {
  data: KPIData;
  extraSavingsInr?: number;
  isHighlighted?: boolean;
}

interface KPIItem {
  id: string;
  label: string;
  value: string;
  icon: React.ReactNode;
  valueColor: string;
  iconBg: string;
  trend?: string;
  isSpecial?: boolean;
}

function formatInrLakhs(baseStr: string, extraInr: number): string {
  if (!extraInr || extraInr === 0) return baseStr;
  // Parse base (e.g. "₹4.2L" -> 420000)
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

  const kpis: KPIItem[] = [
    {
      id: 'kpi-active-trucks',
      label: 'Active Trucks',
      value: String(data.activeTrucks),
      icon: <Truck className="w-4 h-4" />,
      valueColor: 'text-slate-100',
      iconBg: 'bg-blue-500/15 text-blue-400',
      trend: 'Live',
    },
    {
      id: 'kpi-fleet-otif',
      label: 'Fleet OTIF',
      value: data.fleetOTIF,
      icon: <TrendingUp className="w-4 h-4" />,
      valueColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/15 text-emerald-400',
      trend: '▲ 1.2% wk',
    },
    {
      id: 'kpi-at-risk',
      label: 'At-Risk Consignments',
      value: String(data.atRiskConsignments),
      icon: <AlertOctagon className="w-4 h-4" />,
      valueColor: 'text-red-400',
      iconBg: 'bg-red-500/15 text-red-400',
    },
    {
      id: 'kpi-value-at-risk',
      label: 'Value at Risk',
      value: data.totalValueAtRisk,
      icon: <IndianRupee className="w-4 h-4" />,
      valueColor: 'text-amber-400',
      iconBg: 'bg-amber-500/15 text-amber-400',
    },
    {
      id: 'kpi-avoided-penalties',
      label: 'Avoided Penalties',
      value: displayedAvoided,
      icon: <ShieldCheck className="w-4 h-4" />,
      valueColor: extraSavingsInr > 0 ? 'text-emerald-300' : 'text-cyan-400',
      iconBg: extraSavingsInr > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/15 text-cyan-400',
      trend: extraSavingsInr > 0 ? `+₹${(extraSavingsInr / 100000).toFixed(1)}L AI Saved` : 'AI Saved',
      isSpecial: true,
    },
  ];

  return (
    <div className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-sm">
      <div className="px-4 lg:px-6 py-2.5">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {kpis.map((kpi) => (
            <div
              key={kpi.id}
              id={kpi.id}
              className={`kpi-card flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-300
                ${kpi.isSpecial && pulsing
                  ? 'bg-emerald-950/40 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.35)] scale-[1.02]'
                  : kpi.isSpecial && extraSavingsInr > 0
                  ? 'bg-slate-900/90 border-emerald-500/30'
                  : 'bg-slate-900/80 border-slate-800/70'
                } cursor-default`}
            >
              {/* Icon */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${kpi.iconBg}`}>
                {kpi.icon}
              </div>

              {/* Metric */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <p className={`text-base font-bold leading-none tabular-nums ${kpi.valueColor}`}>
                    {kpi.value}
                  </p>
                  {kpi.isSpecial && extraSavingsInr > 0 && (
                    <span className="flex items-center text-[9px] font-semibold text-emerald-400 animate-pulse">
                      <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                      LIVE
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-none truncate">
                  {kpi.label}
                </p>
                {kpi.trend && (
                  <p className={`text-[9px] mt-0.5 leading-none font-medium truncate ${
                    kpi.isSpecial && extraSavingsInr > 0 ? 'text-emerald-400 font-semibold' : 'text-slate-600'
                  }`}>
                    {kpi.trend}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
