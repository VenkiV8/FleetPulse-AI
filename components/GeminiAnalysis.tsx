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
  BarChart2,
  TrendingDown,
  Minus,
  PackageOpen,
  Brain,
  Zap,
  Activity,
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
  strategyId,
  isHovered = false,
  onHoverStrategy,
}: {
  option: GeminiMitigationOption;
  isPrimary: boolean;
  isResolved: boolean;
  onApproveOverride?: (option: GeminiMitigationOption) => void;
  strategyId: 'OPT-1' | 'OPT-2';
  isHovered?: boolean;
  onHoverStrategy?: (id: 'OPT-1' | 'OPT-2' | null) => void;
}) {
  const [stepsOpen, setStepsOpen] = useState(false);
  const feasCfg = feasibilityConfig[option.feasibility];

  return (
    <div
      onMouseEnter={() => onHoverStrategy?.(strategyId)}
      onMouseLeave={() => onHoverStrategy?.(null)}
      onFocus={() => onHoverStrategy?.(strategyId)}
      onBlur={() => onHoverStrategy?.(null)}
      onClick={() => onHoverStrategy?.(isHovered ? null : strategyId)}
      className={`rounded-xl border p-3.5 transition-all duration-200 cursor-pointer ${
        isResolved
          ? 'bg-emerald-950/20 border-emerald-500/30'
          : isHovered
          ? strategyId === 'OPT-1'
            ? 'bg-emerald-950/30 border-emerald-500/60 ring-2 ring-emerald-500/40 shadow-[0_0_16px_rgba(16,185,129,0.25)]'
            : 'bg-amber-950/30 border-amber-500/60 ring-2 ring-amber-500/40 shadow-[0_0_16px_rgba(245,158,11,0.25)]'
          : isPrimary
          ? 'bg-blue-950/20 border-blue-800/40 hover:border-blue-700/60'
          : 'bg-slate-900/60 border-slate-800/60 hover:border-slate-700'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${isResolved
            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
            : isPrimary
            ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
            : 'bg-slate-700/50 text-slate-400 border-slate-600/30'
          }`}>
            {isResolved ? '✓ AUTHORIZED' : isPrimary ? '★ PRIMARY' : 'ALTERNATIVE'}
          </span>
          {isHovered && !isResolved && (
            <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded animate-pulse ${
              strategyId === 'OPT-1'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            }`}>
              ⚡ MAP PREVIEW ACTIVE
            </span>
          )}
        </div>
        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${feasCfg.bg} ${feasCfg.color}`}>
          {option.feasibility}
        </span>
      </div>

      <p className={`text-xs font-semibold mb-3 leading-snug ${isResolved ? 'text-emerald-200' : isHovered ? (strategyId === 'OPT-1' ? 'text-emerald-100' : 'text-amber-100') : isPrimary ? 'text-blue-100' : 'text-slate-200'}`}>
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
        type="button"
        className="w-full flex items-center justify-between text-[10px] text-slate-500 hover:text-slate-300 transition-colors duration-150 py-1"
        onClick={(e) => {
          e.stopPropagation();
          setStepsOpen(!stepsOpen);
        }}
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
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onApproveOverride?.(option);
            }}
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

// ── AI Reasoning / Explainability Drawer ─────────────────────────────────
const INPUT_PARAMS = [
  { key: 'Cargo JIT Sensitivity',                value: 'Tier-1 Assembly (Line-stop penalty active)' },
  { key: 'Contractual SLA Penalty Rate',          value: '₹35,000 / hour' },
  { key: 'Corridor Hazard Index',                 value: '0.94 — Severe flooding, zero passability' },
  { key: 'Telemetry Distance to Destination',     value: '360 km' },
  { key: 'Alt. Corridor SH-17 Clearance',         value: 'Validated (No active flood alerts)' },
] as const;

const COT_STEPS = [
  {
    label: 'Telemetry Analysis',
    detail: 'Confirmed vehicle static at KM 342. Projected delay exceeds acceptable buffer by 6 hours.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/25',
  },
  {
    label: 'Cost-to-Penalty Optimisation',
    detail: 'Evaluated detour fuel expenditure (+₹14,500) against client SLA forfeiture (−₹2,62,500).',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/25',
  },
  {
    label: 'Governance Recommendation',
    detail: 'Diverting vehicle yields +₹2,48,000 net value. Human authorisation requested due to >₹10,000 operational expense threshold.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/25',
  },
] as const;

function AIReasoningDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-violet-800/30 bg-slate-900/40 overflow-hidden">
      {/* Toggle button */}
      <button
        id="ai-reasoning-drawer-toggle"
        className="w-full flex items-center justify-between px-3.5 py-3 hover:bg-slate-800/40 transition-colors duration-150 group"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-md bg-violet-500/15 border border-violet-500/25 flex items-center justify-center shrink-0">
            <Brain className="w-3 h-3 text-violet-400" />
          </div>
          <span className="text-xs font-semibold text-slate-200 group-hover:text-slate-100 transition-colors">
            Inspect AI Decision Logic & Telematics Payload
          </span>
          <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-violet-500/10 border border-violet-500/25 text-violet-400 font-mono">
            <Zap className="w-2.5 h-2.5" />
            XAI
          </span>
        </div>
        {open
          ? <ChevronUp className="w-3.5 h-3.5 text-slate-600" />
          : <ChevronDown className="w-3.5 h-3.5 text-slate-600" />}
      </button>

      {open && (
        <div className="border-t border-slate-800/60 slide-in">

          {/* Engine Metadata Strip */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3.5 py-2.5 bg-violet-950/20 border-b border-slate-800/50">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-violet-400 shrink-0" />
              <span className="text-[9px] font-bold text-violet-300 uppercase tracking-widest">Engine</span>
            </div>
            {([
              { label: 'Model',             value: 'Gemini 2.5 Flash' },
              { label: 'Temperature',       value: '0.2' },
              { label: 'Latency',           value: '840 ms' },
              { label: 'Risk Confidence',   value: '92%' },
            ] as const).map((meta) => (
              <div key={meta.label} className="flex items-center gap-1">
                <span className="text-[9px] text-slate-600">{meta.label}:</span>
                <span className="text-[9px] font-mono font-semibold text-slate-300">{meta.value}</span>
              </div>
            ))}
          </div>

          {/* Input Parameters Matrix */}
          <div className="px-3.5 pt-3 pb-2.5">
            <p className="text-[9px] text-slate-600 uppercase tracking-widest font-semibold mb-2">Input Parameters</p>
            <div className="space-y-1.5">
              {INPUT_PARAMS.map((p) => (
                <div key={p.key} className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 py-1.5 px-2.5 rounded-lg bg-slate-800/40 border border-slate-700/30">
                  <span className="text-[9px] text-slate-500 font-mono leading-relaxed whitespace-nowrap">{p.key}</span>
                  <span className="text-[9px] text-slate-300 font-mono leading-relaxed break-words">{p.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chain-of-Thought Steps */}
          <div className="px-3.5 pb-3.5">
            <p className="text-[9px] text-slate-600 uppercase tracking-widest font-semibold mb-2.5">Chain-of-Thought Reasoning</p>
            <div className="relative pl-4">
              {/* Vertical connector line */}
              <div className="absolute left-[7px] top-3 bottom-3 w-px bg-slate-700/50" />

              <div className="space-y-3">
                {COT_STEPS.map((step, i) => (
                  <div key={step.label} className="flex gap-3">
                    {/* Step number node */}
                    <div className={`relative z-10 flex items-center justify-center w-5 h-5 rounded-full border shrink-0 text-[9px] font-bold ${step.bg} ${step.color}`}>
                      {i + 1}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0 pb-0.5">
                      <p className={`text-[10px] font-semibold mb-0.5 ${step.color}`}>{step.label}</p>
                      <p className="text-[10px] text-slate-400 leading-relaxed">{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── CFO Cost-Benefit Comparison Table ────────────────────────────────────
const COMPARISON_COLS = [
  {
    id: 'status-quo',
    label: 'Status Quo',
    sublabel: 'Do Nothing',
    routeCost: 0,
    slaPenalty: 262500,
    slaPenaltyLabel: '7.5h Delay',
    netAmount: -262500,
    netLabel: '₹2,62,500 Loss',
    netVariant: 'loss' as const,
    colClass: 'border-red-800/40 bg-red-950/20',
    headerClass: 'text-red-300',
    badgeClass: 'bg-red-500/15 border-red-500/30 text-red-400',
  },
  {
    id: 'strategy-1',
    label: 'Strategy 1',
    sublabel: 'SH-17 Bypass ⭐',
    routeCost: 14500,
    slaPenalty: 0,
    slaPenaltyLabel: 'On-Time',
    netAmount: 248000,
    netLabel: '+₹2,48,000 Saved',
    netVariant: 'win' as const,
    colClass: 'border-emerald-800/40 bg-emerald-950/20',
    headerClass: 'text-emerald-300',
    badgeClass: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
  },
  {
    id: 'strategy-2',
    label: 'Strategy 2',
    sublabel: 'Surat Cross-Dock',
    routeCost: 32000,
    slaPenalty: 21000,
    slaPenaltyLabel: '0.6h Delay',
    netAmount: 209500,
    netLabel: '+₹2,09,500 Saved',
    netVariant: 'partial' as const,
    colClass: 'border-blue-800/40 bg-blue-950/20',
    headerClass: 'text-blue-300',
    badgeClass: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
  },
] as const;

const EXPENSE_ITEMS = [
  { label: 'Additional Fuel & Tolls', amount: 9500, color: 'text-amber-400' },
  { label: 'Driver Overtime Allowance', amount: 3000, color: 'text-amber-400' },
  { label: 'Buffer / Contingency Surcharge', amount: 2000, color: 'text-amber-400' },
  { label: 'Net Avoided Client SLA Penalty', amount: 262500, color: 'text-emerald-400', isGain: true },
];

function formatInrCompact(amount: number): string {
  if (amount === 0) return '₹0';
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

function CostBenefitTable() {
  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-slate-800/70 bg-slate-900/80">
        <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">CFO Trade-Off Matrix</span>
        <span className="ml-auto text-[9px] text-slate-600 font-mono">3-Way Decision</span>
      </div>

      {/* Column grid */}
      <div className="grid grid-cols-3 divide-x divide-slate-800/60">
        {COMPARISON_COLS.map((col) => (
          <div key={col.id} className={`flex flex-col p-2.5 border-t-2 ${col.colClass}`}>
            {/* Column Header */}
            <div className="mb-2">
              <p className={`text-[9px] font-bold uppercase tracking-wider ${col.headerClass}`}>{col.label}</p>
              <p className="text-[9px] text-slate-500 leading-tight mt-0.5">{col.sublabel}</p>
            </div>

            {/* Route Cost */}
            <div className="mb-2">
              <p className="text-[8px] text-slate-600 uppercase tracking-wide mb-0.5">Route Cost</p>
              <p className="text-[10px] font-semibold text-slate-300 tabular-nums">
                {col.routeCost === 0 ? <span className="text-slate-500">₹0</span> : `+${formatInrCompact(col.routeCost)}`}
              </p>
            </div>

            {/* SLA Penalty */}
            <div className="mb-2.5">
              <p className="text-[8px] text-slate-600 uppercase tracking-wide mb-0.5">SLA Penalty</p>
              <p className={`text-[10px] font-semibold tabular-nums ${
                col.slaPenalty === 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {col.slaPenalty === 0 ? '—' : formatInrCompact(col.slaPenalty)}
              </p>
              <p className="text-[8px] text-slate-600 mt-0.5">{col.slaPenaltyLabel}</p>
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-800/70 mb-2.5" />

            {/* Net Outcome Badge */}
            <div className={`px-2 py-1.5 rounded-lg border text-center ${col.badgeClass}`}>
              <p className="text-[8px] uppercase tracking-wide opacity-70 mb-0.5">
                {col.netVariant === 'loss' ? 'Net Outcome' : 'Net Benefit'}
              </p>
              <p className="text-[10px] font-bold leading-tight">{col.netLabel}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExpenseBreakdownDrawer() {
  const [open, setOpen] = useState(false);
  const totalCost = EXPENSE_ITEMS.filter((i) => !i.isGain).reduce((s, i) => s + i.amount, 0);
  const roiMultiple = 17.1;

  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 overflow-hidden">
      <button
        id="expense-breakdown-drawer-toggle"
        className="w-full flex items-center justify-between px-3.5 py-3 hover:bg-slate-800/40 transition-colors duration-150"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5">
          <PackageOpen className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-xs font-semibold text-slate-200">Itemised Cost Breakdown</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-500 font-mono">
            Strategy 1
          </span>
        </div>
        {open
          ? <ChevronUp className="w-3.5 h-3.5 text-slate-600" />
          : <ChevronDown className="w-3.5 h-3.5 text-slate-600" />}
      </button>

      {open && (
        <div className="border-t border-slate-800/60 px-3.5 py-3 space-y-1.5 slide-in">
          {EXPENSE_ITEMS.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {item.isGain
                  ? <TrendingUp className="w-3 h-3 text-emerald-500 shrink-0" />
                  : <Minus className="w-3 h-3 text-slate-600 shrink-0" />}
                <span className="text-[10px] text-slate-400 leading-tight">{item.label}</span>
              </div>
              <span className={`text-[10px] font-bold tabular-nums shrink-0 ${item.color}`}>
                {item.isGain ? '+' : '-'}₹{item.amount.toLocaleString('en-IN')}
              </span>
            </div>
          ))}

          {/* Total cost row */}
          <div className="mt-2 pt-2 border-t border-slate-800/60">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-500">Total Additional Cost</span>
              <span className="text-[10px] font-semibold text-slate-300 tabular-nums">-₹{totalCost.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* ROI strip */}
          <div className="mt-2 flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-950/40 border border-emerald-800/40">
            <span className="text-[10px] font-semibold text-emerald-300">Net ROI Multiple</span>
            <span className="text-sm font-extrabold text-emerald-400 tabular-nums">{roiMultiple}×</span>
          </div>
        </div>
      )}
    </div>
  );
}

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
  hoveredStrategyId?: 'OPT-1' | 'OPT-2' | null;
  onHoverStrategy?: (id: 'OPT-1' | 'OPT-2' | null) => void;
}

export default function GeminiAnalysis({
  consignment,
  scenarioId,
  disruption,
  isResolved,
  onApproveOverride,
  hoveredStrategyId = null,
  onHoverStrategy,
}: GeminiAnalysisProps) {
  const [result, setResult] = useState<GeminiAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [source, setSource] = useState<string | null>(null);
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);

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
      const errHeader = res.headers.get('X-FleetPulse-Error');
      setSource(srcHeader);
      setFallbackReason(errHeader);

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
          <span
            title={fallbackReason === 'rate-limited' ? 'Google AI Studio API quota exceeded — running on pre-calculated resilience model' : undefined}
            className={`inline-flex items-center gap-1.5 text-[9px] px-2 py-0.5 rounded-md border font-mono font-semibold
            ${source.startsWith('gemini')
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
              : source === 'mock-fallback'
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {source.startsWith('gemini') ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ⚡ Gemini Live ({source})
              </>
            ) : source === 'mock-fallback' ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                📋 Mock Fallback {fallbackReason === 'rate-limited' ? '(Quota 429)' : ''}
              </>
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
              {result.mitigation_options.map((opt) => {
                const stratId = opt.rank === 1 ? 'OPT-1' : 'OPT-2';
                return (
                  <StrategyCard
                    key={opt.rank}
                    option={opt}
                    strategyId={stratId}
                    isHovered={hoveredStrategyId === stratId}
                    onHoverStrategy={onHoverStrategy}
                    isPrimary={opt.rank === 1}
                    isResolved={isResolved}
                    onApproveOverride={onApproveOverride}
                  />
                );
              })}
            </div>
          </div>

          {/* ── AI Decision Logic & Telematics Drawer ── */}
          <AIReasoningDrawer />

          {/* ── CFO Trade-Off Table ── */}
          <CostBenefitTable />

          {/* ── Expense Breakdown Drawer ── */}
          <ExpenseBreakdownDrawer />

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
