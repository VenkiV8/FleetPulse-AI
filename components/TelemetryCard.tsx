'use client';

import { Fuel, Milestone, Navigation2, Clock, CheckCircle2 } from 'lucide-react';
import type { Telemetry } from '@/lib/types';

interface TelemetryCardProps {
  telemetry: Telemetry;
  truckId: string;
  route: string;
  isResolved?: boolean;
}

function SpeedGauge({ speed, isResolved }: { speed: number; isResolved: boolean }) {
  const maxSpeed = 120;
  const pct = Math.min(speed / maxSpeed, 1);
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75;
  const fillLength = arcLength * pct;

  const speedColor = isResolved
    ? '#22c55e'
    : speed === 0
    ? '#ef4444'
    : speed < 40
    ? '#f59e0b'
    : speed < 90
    ? '#22c55e'
    : '#3b82f6';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-20 flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full -rotate-[135deg]" viewBox="0 0 80 80">
          {/* Track */}
          <circle
            cx="40" cy="40" r={radius}
            fill="none"
            stroke="#1e293b"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
          />
          {/* Fill */}
          <circle
            cx="40" cy="40" r={radius}
            fill="none"
            stroke={speedColor}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${fillLength} ${circumference}`}
            className="speed-gauge-ring transition-all duration-700 ease-out"
            style={{ color: speedColor }}
          />
        </svg>
        <div className="flex flex-col items-center">
          <span className="text-base font-bold text-slate-100 tabular-nums leading-none">
            {speed}
          </span>
          <span className="text-[9px] text-slate-500 leading-none mt-0.5">km/h</span>
        </div>
      </div>
      <span className="text-[10px] text-slate-500 mt-1">Speed</span>
    </div>
  );
}

function FuelBar({ fuel }: { fuel: number }) {
  const color =
    fuel < 25 ? '#ef4444' : fuel < 50 ? '#f59e0b' : '#22c55e';

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full flex items-center justify-between mb-1.5">
        <Fuel className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-xs font-semibold tabular-nums" style={{ color }}>
          {fuel}%
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div
          className="fuel-bar-fill h-full rounded-full"
          style={{ width: `${fuel}%`, background: color }}
        />
      </div>
      <span className="text-[10px] text-slate-500 mt-1.5 self-start">Fuel Level</span>
    </div>
  );
}

export default function TelemetryCard({ telemetry, truckId, route, isResolved }: TelemetryCardProps) {
  return (
    <div className="border-t border-slate-800/70 px-4 py-3">
      {/* Sub-header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs font-semibold text-slate-100 font-mono">{truckId}</span>
          <span className="text-slate-600 mx-1">·</span>
          <span className="text-xs text-slate-400 truncate">{route}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] shrink-0">
          {isResolved ? (
            <>
              <CheckCircle2 className="w-3 h-3 text-green-400" />
              <span className="text-green-400 font-medium">Route Restored</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 blink-dot" />
              <span className="text-slate-500">Live Telemetry</span>
            </>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="flex items-start gap-4">
        {/* Speed Gauge */}
        <SpeedGauge speed={telemetry.speed} isResolved={isResolved ?? false} />

        {/* Right Metrics */}
        <div className="flex-1 grid grid-cols-1 gap-3">
          {/* Fuel */}
          <FuelBar fuel={telemetry.fuel} />

          {/* Odometer + Distance Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <Milestone className="w-3.5 h-3.5 text-slate-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-100 tabular-nums">
                  {telemetry.odometer.toLocaleString('en-IN')} km
                </p>
                <p className="text-[10px] text-slate-500">Odometer</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Navigation2 className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isResolved ? 'text-green-500' : 'text-blue-500'}`} />
              <div>
                <p className="text-xs font-semibold text-slate-100 tabular-nums">
                  {telemetry.distanceRemaining} km
                </p>
                <p className="text-[10px] text-slate-500">Remaining</p>
              </div>
            </div>
          </div>
        </div>

        {/* ETA Chip */}
        <div className="flex flex-col items-center self-center shrink-0">
          <div className={`w-12 h-12 rounded-xl border flex flex-col items-center justify-center
            ${isResolved ? 'bg-green-950/40 border-green-800/40' : 'bg-slate-800/80 border-slate-700'}
          `}>
            <Clock className={`w-3.5 h-3.5 mb-0.5 ${isResolved ? 'text-green-400' : 'text-slate-500'}`} />
            <span className={`text-[10px] font-semibold tabular-nums leading-none ${isResolved ? 'text-green-300' : 'text-slate-300'}`}>
              {telemetry.eta}
            </span>
          </div>
          <span className="text-[9px] text-slate-600 mt-1">ETA</span>
        </div>
      </div>
    </div>
  );
}
