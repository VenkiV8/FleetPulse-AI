'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Loader2,
  AlertTriangle,
  TrendingUp,
  IndianRupee,
  Clock,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  FileText,
  MessageSquare,
  ListChecks,
  Cpu,
} from 'lucide-react';
import type { Consignment } from '@/lib/types';
import type {
  GeminiAnalysisResult,
  GeminiMitigationOption,
  GeminiSeverity,
  GeminiFeasibility,
} from '@/lib/geminiTypes';
import type { CopilotRequestBody } from '@/lib/geminiTypes';

// ── Helpers ───────────────────────────────────────────────────────────────

function formatInr(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

function formatMinutes(min: number): string {
  if (min === 0) return 'No delay';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `+${m}m`;
  return m === 0 ? `+${h}h` : `+${h}h ${m}m`;
}

// ── Severity Config ───────────────────────────────────────────────────────
const severityConfig: Record<GeminiSeverity, { color: string; bg: string; label: string; gaugeColor: string }> = {
  CRITICAL: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/25', label: 'CRITICAL', gaugeColor: '#ef4444' },
  HIGH:     { color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/25', label: 'HIGH', gaugeColor: '#f97316' },
  MEDIUM:   { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/25', label: 'MEDIUM', gaugeColor: '#f59e0b' },
  LOW:      { color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/25', label: 'LOW', gaugeColor: '#22c55e' },
};

const feasibilityConfig: Record<GeminiFeasibility, { color: string; bg: string }> = {
  HIGH:   { color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  MEDIUM: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  LOW:    { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
};


// ── Radial Breach Risk Gauge ──────────────────────────────────────────────
function RiskGauge({
  probability,
  severity,
  timeToBreachHours,
  financialExposureInr,
}: {
  probability: number;
  severity: GeminiSeverity;
  timeToBreachHours: number;
  financialExposureInr: number;
}) {
  const cfg = severityConfig[severity];
  const pct = Math.round(probability * 100);

  const r = 42;
  const cx = 56;
  const cy = 60;
  const circ = 2 * Math.PI * r;
  const trackLen = circ * 0.75;
  const fillLen = trackLen * probability;

  const h = Math.floor(timeToBreachHours);
  const m = Math.round((timeToBreachHours - h) * 60);
  const timeStr = h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;

  return (
    <div className={`rounded-xl border p-4 ${cfg.bg}`}>
      <div className="flex items-center gap-4">
        {/* Gauge */}
        <div className="relative w-24 h-[72px] flex items-center justify-center shrink-0">
          <svg viewBox="0 0 112 80" className="absolute inset-0 w-full h-full -rotate-[135deg]">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${trackLen} ${circ}`} />
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={cfg.gaugeColor} strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${fillLen} ${circ}`}
              style={{ filter: `drop-shadow(0 0 5px ${cfg.gaugeColor}70)`, transition: 'stroke-dasharray 1s ease' }} />
          </svg>
          <div className="flex flex-col items-center z-10 mt-1">
            <span className={`text-2xl font-bold tabular-nums leading-none ${cfg.color}`}>{pct}%</span>
            <span className="text-[8px] text-slate-500 mt-0.5 uppercase tracking-wide">SLA Breach</span>
          </div>
        </div>

        {/* Side metrics */}
        <div className="flex-1 space-y-2.5">
          <div>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">Severity</p>
            <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label} RISK</span>
          </div>
          <div>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">Time to Breach</p>
            <p className={`text-xs font-semibold ${cfg.color}`}>{timeStr}</p>
          </div>
          <div>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">Financial Exposure</p>
            <p className="text-xs font-bold text-slate-100">{formatInr(financialExposureInr)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Copy Button ───────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px]
                 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200
                 border border-slate-700 transition-all duration-150"
    >
      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

// ── Collapsible Drawer ────────────────────────────────────────────────────
function CollapsibleDrawer({
  id,
  icon,
  title,
  badge,
  children,
  defaultOpen = false,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  badge?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 overflow-hidden">
      <button
        id={id}
        className="w-full flex items-center justify-between px-3.5 py-3 hover:bg-slate-800/40 transition-colors duration-150"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5">
          {icon}
          <span className="text-xs font-semibold text-slate-200">{title}</span>
          {badge && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-500 font-mono">
              {badge}
            </span>
          )}
        </div>
        {open
          ? <ChevronUp className="w-3.5 h-3.5 text-slate-600" />
          : <ChevronDown className="w-3.5 h-3.5 text-slate-600" />}
      </button>
      {open && (
        <div className="border-t border-slate-800/60 slide-in">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Strategy Card ─────────────────────────────────────────────────────────
function StrategyCard({
  option,
  isPrimary,
  isResolved,
  onApproveOverride,
}: {
  option: GeminiMitigationOption;
  isPrimary: boolean;
  isResolved: boolean;
  onApproveOverride?: (option: GeminiMitigationOption) => void;
}) {
  const [stepsOpen, setStepsOpen] = useState(false);
  const feasCfg = feasibilityConfig[option.feasibility];

  return (
    <div className={`rounded-xl border p-3.5 transition-all duration-200 ${isResolved
      ? 'bg-emerald-950/20 border-emerald-500/30'
      : isPrimary
      ? 'bg-blue-950/20 border-blue-800/40 hover:border-blue-700/60'
      : 'bg-slate-900/60 border-slate-800/60 hover:border-slate-700'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${isResolved
            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
            : isPrimary
            ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
            : 'bg-slate-700/50 text-slate-400 border-slate-600/30'
          }`}>
            {isResolved ? '✓ AUTHORIZED' : isPrimary ? '★ PRIMARY' : 'ALTERNATIVE'}
          </span>
        </div>
        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${feasCfg.bg} ${feasCfg.color}`}>
          {option.feasibility}
        </span>
      </div>

      <p className={`text-xs font-semibold mb-3 leading-snug ${isResolved ? 'text-emerald-200' : isPrimary ? 'text-blue-100' : 'text-slate-200'}`}>
        {option.strategy}
      </p>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {/* Cost */}
        <div className="flex flex-col items-center p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
          <IndianRupee className="w-3 h-3 text-slate-500 mb-1" />
          <span className="text-[11px] font-bold text-slate-200 tabular-nums">
            {formatInr(option.operational_cost_inr)}
          </span>
          <span className="text-[8px] text-slate-500 mt-0.5 text-center">Op. Cost</span>
        </div>

        {/* Delay */}
        <div className="flex flex-col items-center p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
          <Clock className="w-3 h-3 text-amber-500 mb-1" />
          <span className="text-[11px] font-bold text-amber-400 tabular-nums">
            {formatMinutes(option.delay_impact_minutes)}
          </span>
          <span className="text-[8px] text-slate-500 mt-0.5 text-center">Delay</span>
        </div>

        {/* Net Savings — highlighted */}
        <div className={`flex flex-col items-center p-2 rounded-lg border ${
          isResolved
            ? 'bg-emerald-900/40 border-emerald-500/40'
            : 'bg-green-950/40 border-green-800/40'
        }`}>
          <TrendingUp className="w-3 h-3 text-green-400 mb-1" />
          <span className="text-[11px] font-bold text-green-400 tabular-nums">
            {formatInr(option.net_savings_inr)}
          </span>
          <span className="text-[8px] text-green-600 mt-0.5 text-center">Net Saved</span>
        </div>
      </div>

      {/* Action Steps toggle */}
      <button
        className="w-full flex items-center justify-between text-[10px] text-slate-500 hover:text-slate-300 transition-colors duration-150 py-1"
        onClick={() => setStepsOpen(!stepsOpen)}
        aria-expanded={stepsOpen}
      >
        <span className="flex items-center gap-1.5">
          <ListChecks className="w-3 h-3" />
          Action Steps ({option.action_steps.length})
        </span>
        {stepsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {stepsOpen && (
        <ol className="mt-2.5 space-y-1.5 slide-in mb-3">
          {option.action_steps.map((step, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className={`text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5
                ${isPrimary ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'}`}>
                {i + 1}
              </span>
              <p className="text-[10px] text-slate-400 leading-relaxed">{step}</p>
            </li>
          ))}
        </ol>
      )}

      {/* One-Click Approval Workflow Button */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80">
        {isResolved ? (
          <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <Check className="w-3.5 h-3.5" />
              Dispatch Override Authorized
            </span>
            <span className="text-[9px] font-mono text-emerald-400/80">SMS Dispatched</span>
          </div>
        ) : (
          <button
            id={`approve-override-${option.rank}`}
            onClick={() => onApproveOverride?.(option)}
            className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold
                       transition-all duration-200 shadow-sm cursor-pointer
                       ${isPrimary
                         ? 'bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white shadow-blue-500/20 hover:shadow-emerald-500/30 hover:scale-[1.01]'
                         : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                       }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Approve Dispatch Override
          </button>
        )}
      </div>
    </div>
  );
}

// ── Loading Skeleton ──────────────────────────────────────────────────────
function GeminiLoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Gauge skeleton */}
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-4 h-24" />
      {/* Summary skeleton */}
      <div className="space-y-1.5">
        <div className="h-3 bg-slate-800 rounded w-3/4" />
        <div className="h-3 bg-slate-800 rounded w-full" />
        <div className="h-3 bg-slate-800 rounded w-5/6" />
      </div>
      {/* Strategy card skeletons */}
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-3.5 h-32" />
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-3.5 h-28" />
    </div>
  );
}

// ── Error state ───────────────────────────────────────────────────────────
function GeminiError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-4 text-center">
      <p className="text-xs text-slate-500 mb-2">Analysis unavailable</p>
      <button onClick={onRetry}
        className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors duration-150">
        Retry
      </button>
    </div>
  );
}

// ── Main GeminiAnalysis Component ─────────────────────────────────────────
interface GeminiAnalysisProps {
  consignment: Consignment;
  scenarioId: string;
  disruption: string;
  isResolved: boolean;
  onApproveOverride?: (option: GeminiMitigationOption) => void;
}

export default function GeminiAnalysis({
  consignment,
  scenarioId,
  disruption,
  isResolved,
  onApproveOverride,
}: GeminiAnalysisProps) {
  const [result, setResult] = useState<GeminiAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [source, setSource] = useState<'gemini-2.0-flash' | 'mock' | 'mock-fallback' | null>(null);

  const fetchAnalysis = useCallback(async () => {
    setLoading(true);
    setError(false);
    setResult(null);

    const body: CopilotRequestBody = {
      scenarioId,
      consignmentId: consignment.id,
      client: consignment.client,
      route: consignment.route,
      cargo: consignment.cargo,
      disruption,
      delay: consignment.delay,
      status: consignment.status,
      telemetry: {
        speed: consignment.telemetry.speed,
        fuel: consignment.telemetry.fuel,
        distanceRemaining: consignment.telemetry.distanceRemaining,
        eta: consignment.telemetry.eta,
      },
      origin: consignment.origin.label ?? consignment.origin.lat + ',' + consignment.origin.lng,
      destination: consignment.destination.label ?? consignment.destination.lat + ',' + consignment.destination.lng,
      hazardLocation: consignment.hazardPoint.label ?? `${consignment.hazardPoint.lat},${consignment.hazardPoint.lng}`,
    };

    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const srcHeader = res.headers.get('X-FleetPulse-Source') ?? 'mock';
      setSource(srcHeader as typeof source);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: GeminiAnalysisResult = await res.json();
      setResult(data);
    } catch (err) {
      console.error('[GeminiAnalysis] fetch error:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [consignment.id, scenarioId]);

  // Re-fetch when consignment changes
  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  const smsCharCount = result?.customer_status_advisory.length ?? 0;

  return (
    <div className="space-y-4">
      {/* ── Section Header ── */}
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-blue-400" />
          Gemini Intelligence
        </h3>
        {source && (
          <span className={`inline-flex items-center gap-1.5 text-[9px] px-2 py-0.5 rounded-md border font-mono font-semibold
            ${source.startsWith('gemini')
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
              : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
            {source.startsWith('gemini') ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ⚡ Gemini Live ({source})
              </>
            ) : source === 'mock-fallback' ? (
              '📋 Mock Fallback'
            ) : (
              '📋 Mock'
            )}
          </span>
        )}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
            Analyzing corridor telematics…
          </div>
          <GeminiLoadingSkeleton />
        </div>
      )}

      {/* ── Error ── */}
      {!loading && error && <GeminiError onRetry={fetchAnalysis} />}

      {/* ── Result ── */}
      {!loading && result && (
        <div className="space-y-3.5">

          {/* ── Breach Risk Gauge ── */}
          <RiskGauge
            probability={result.risk_assessment.breach_probability}
            severity={result.risk_assessment.severity}
            timeToBreachHours={result.risk_assessment.time_to_breach_hours}
            financialExposureInr={result.risk_assessment.financial_exposure_inr}
          />

          {/* ── AI Summary ── */}
          <div className="px-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Assessment</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {isResolved
                ? result.risk_assessment.summary.replace(/breach|critical|risk|blocked|stranded|halting|placing/gi, (w) => w)
                : result.risk_assessment.summary}
            </p>
          </div>

          {/* ── Strategy Cards ── */}
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2">
              Mitigation Strategies
            </p>
            <div className="space-y-2.5">
              {result.mitigation_options.map((opt) => (
                <StrategyCard
                  key={opt.rank}
                  option={opt}
                  isPrimary={opt.rank === 1}
                  isResolved={isResolved}
                  onApproveOverride={onApproveOverride}
                />
              ))}
            </div>
          </div>

          {/* ── Driver Dispatch Memo ── */}
          <CollapsibleDrawer
            id="driver-dispatch-memo-drawer"
            icon={<FileText className="w-3.5 h-3.5 text-cyan-400" />}
            title="Driver Dispatch Memo"
            badge="AUTO-GENERATED"
          >
            <div className="px-3.5 py-3">
              <div className="flex justify-end mb-2">
                <CopyButton text={result.driver_dispatch_memo} />
              </div>
              <pre className="text-[10px] text-slate-300 font-mono leading-relaxed whitespace-pre-wrap break-words bg-slate-950/60 rounded-lg p-3 border border-slate-800/60">
                {result.driver_dispatch_memo}
              </pre>
            </div>
          </CollapsibleDrawer>

          {/* ── Customer Advisory SMS ── */}
          <CollapsibleDrawer
            id="customer-advisory-drawer"
            icon={<MessageSquare className="w-3.5 h-3.5 text-purple-400" />}
            title="Customer Advisory SMS"
            badge={`${smsCharCount}/160`}
          >
            <div className="px-3.5 py-3">
              <div className="flex justify-end mb-2">
                <CopyButton text={result.customer_status_advisory} />
              </div>
              <div className="bg-slate-950/60 rounded-xl border border-slate-800/60 p-3.5">
                {/* Phone frame style */}
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-800">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <span className="text-[9px] text-slate-500 font-mono">FleetPulse AI · SMS Preview</span>
                </div>
                <p className="text-[11px] text-slate-200 leading-relaxed font-mono">
                  {result.customer_status_advisory}
                </p>
                {/* Char count bar */}
                <div className="mt-2.5">
                  <div className="h-0.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        smsCharCount > 140 ? 'bg-amber-400' : smsCharCount === 160 ? 'bg-red-400' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min((smsCharCount / 160) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] text-slate-600">0</span>
                    <span className={`text-[9px] ${smsCharCount > 140 ? 'text-amber-400' : 'text-slate-600'}`}>
                      {smsCharCount}/160 chars
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleDrawer>
        </div>
      )}
    </div>
  );
}
