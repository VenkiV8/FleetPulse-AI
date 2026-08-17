'use client';

import { useState, useEffect } from 'react';
import {
  Bot,
  ShieldAlert,
  CheckCircle2,
  RotateCcw,
  Bell,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Zap,
  ExternalLink,
  Loader2,
  Sparkles,
} from 'lucide-react';
import type { AIAnalysis, AIAction, AIRiskItem, Consignment } from '@/lib/types';
import type { GeminiMitigationOption } from '@/lib/geminiTypes';
import GeminiAnalysis from './GeminiAnalysis';

// ── Severity config ───────────────────────────────────────────────────────
const severityConfig = {
  HIGH:   { label: 'HIGH', containerClass: 'bg-red-950/40 border-red-800/40', badgeClass: 'bg-red-500/15 text-red-400 border-red-500/25', iconClass: 'text-red-400' },
  MEDIUM: { label: 'MED', containerClass: 'bg-amber-950/30 border-amber-800/30', badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/25', iconClass: 'text-amber-400' },
  LOW:    { label: 'LOW', containerClass: 'bg-slate-900/60 border-slate-800/60', badgeClass: 'bg-slate-700/50 text-slate-400 border-slate-600/25', iconClass: 'text-slate-400' },
};

// ── Action type config ────────────────────────────────────────────────────
const actionTypeConfig = {
  REROUTE:  { icon: RotateCcw, label: 'REROUTE',  color: 'text-blue-400',   bg: 'bg-blue-500/10' },
  NOTIFY:   { icon: Bell,      label: 'NOTIFY',   color: 'text-cyan-400',   bg: 'bg-cyan-500/10' },
  ESCALATE: { icon: TrendingUp,label: 'ESCALATE', color: 'text-amber-400',  bg: 'bg-amber-500/10' },
  OVERRIDE: { icon: Zap,       label: 'OVERRIDE', color: 'text-purple-400', bg: 'bg-purple-500/10' },
};

// ── Analyzing Overlay ─────────────────────────────────────────────────────
function AnalyzingOverlay({ message }: { message: string }) {
  const steps = [
    'Fetching live telematics feed',
    'Cross-referencing NHAI incident data',
    'Calculating re-route options',
    'Scoring risk vectors',
  ];
  const [dots, setDots] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const dotsId = setInterval(() => setDots((d) => (d.length >= 3 ? '' : d + '.')), 420);
    const progId = setInterval(() => setProgress((p) => Math.min(p + Math.random() * 18, 95)), 200);
    return () => { clearInterval(dotsId); clearInterval(progId); };
  }, []);

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/92 backdrop-blur-sm">
      <div className="relative mb-5">
        <div className="w-16 h-16 rounded-full border-2 border-slate-800 flex items-center justify-center">
          <Bot className="w-7 h-7 text-blue-400" />
        </div>
        <Loader2 className="absolute inset-0 w-16 h-16 text-blue-500 animate-spin" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-semibold text-slate-100 text-center px-6 leading-snug mb-1">{message}{dots}</p>
      <p className="text-[11px] text-slate-500 mb-5">Corridor intelligence active</p>
      <div className="w-48 h-1 rounded-full bg-slate-800 overflow-hidden mb-5">
        <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-200"
          style={{ width: `${progress}%` }} />
      </div>
      <div className="space-y-1.5 w-52">
        {steps.map((step, i) => {
          const done = progress > (i + 1) * 22;
          return (
            <div key={i} className="flex items-center gap-2">
              {done ? <CheckCircle2 className="w-3 h-3 text-green-400 shrink-0" />
                    : <div className="w-3 h-3 rounded-full border border-slate-700 shrink-0" />}
              <span className={`text-[10px] ${done ? 'text-slate-400' : 'text-slate-600'}`}>{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Risk Card ─────────────────────────────────────────────────────────────
function RiskCard({ item }: { item: AIRiskItem }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = severityConfig[item.severity];
  return (
    <div className={`rounded-xl border p-3.5 ${cfg.containerClass}`}>
      <button className="w-full flex items-start gap-2.5 text-left"
        onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>
        <ShieldAlert className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.iconClass}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${cfg.badgeClass}`}>{cfg.label}</span>
            <span className="text-xs font-semibold text-slate-200 leading-tight">{item.title}</span>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
                  : <ChevronDown className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />}
      </button>
      {expanded && <p className="text-[11px] text-slate-400 leading-relaxed mt-2 ml-6 slide-in">{item.description}</p>}
    </div>
  );
}

// ── Action Card ───────────────────────────────────────────────────────────
function ActionCard({ action, onApprove, disabled }: { action: AIAction; onApprove: (id: string) => void; disabled?: boolean }) {
  const cfg = actionTypeConfig[action.type];
  const ActionIcon = cfg.icon;
  return (
    <div className={`rounded-xl border p-3.5 transition-all duration-200
      ${action.approved ? 'bg-green-950/30 border-green-800/40' : 'bg-slate-900/60 border-slate-800/60 hover:border-slate-700'}`}>
      <div className="flex items-start gap-2.5 mb-2.5">
        <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${cfg.bg}`}>
          <ActionIcon className={`w-3.5 h-3.5 ${cfg.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <span className={`text-[9px] font-bold ${cfg.color}`}>{cfg.label}</span>
          <p className="text-xs font-medium text-slate-200 leading-snug">{action.label}</p>
        </div>
      </div>
      <p className="text-[10px] text-slate-500 leading-relaxed mb-3 pl-8">{action.detail}</p>
      <div className="flex gap-2 pl-8">
        {action.approved ? (
          <div className="flex items-center gap-1.5 text-green-400 text-xs font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />Approved
          </div>
        ) : (
          <>
            <button id={`approve-action-${action.id}`} onClick={() => onApprove(action.id)} disabled={disabled}
              className="action-btn-approve flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 disabled:cursor-not-allowed">
              <CheckCircle2 className="w-3 h-3" />Approve
            </button>
            <button disabled={disabled}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed">
              <ExternalLink className="w-3 h-3" />Review
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────
function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-px bg-slate-800/70" />
      <span className="text-[9px] uppercase tracking-widest text-slate-600 font-semibold">{label}</span>
      <div className="flex-1 h-px bg-slate-800/70" />
    </div>
  );
}

// ── Main AICopilot Component ──────────────────────────────────────────────
interface AICopilotProps {
  analysis: AIAnalysis;
  isAnalyzing: boolean;
  isResolved: boolean;
  consignment: Consignment;
  scenarioId: string;
  disruption: string;
  onApproveOverride?: (option: GeminiMitigationOption) => void;
}

export default function AICopilot({
  analysis,
  isAnalyzing,
  isResolved,
  consignment,
  scenarioId,
  disruption,
  onApproveOverride,
}: AICopilotProps) {
  const [actions, setActions] = useState<AIAction[]>(analysis.actions);
  const [riskItems] = useState<AIRiskItem[]>(analysis.riskItems);
  const [autonomousEnabled, setAutonomousEnabled] = useState(false);

  const handleApprove = (id: string) =>
    setActions((prev) => prev.map((a) => (a.id === id ? { ...a, approved: true } : a)));

  const approvedCount = actions.filter((a) => a.approved).length;
  const allApproved = approvedCount === actions.length;
  const highRiskCount = riskItems.filter((r) => r.severity === 'HIGH').length;

  return (
    <aside className="flex flex-col h-full relative overflow-hidden">
      {/* ── Analyzing Overlay ── */}
      {isAnalyzing && <AnalyzingOverlay message={analysis.analyzingMessage} />}

      {/* ── Panel Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/70 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <h2 className="text-sm font-semibold text-slate-100">AI Copilot</h2>
        </div>
        <div className="flex items-center gap-1.5 text-[10px]">
          {isResolved ? (
            <><CheckCircle2 className="w-3 h-3 text-green-400" /><span className="text-green-400">Resolved</span></>
          ) : isAnalyzing ? (
            <><Loader2 className="w-3 h-3 text-blue-400 animate-spin" /><span className="text-blue-400">Analyzing</span></>
          ) : (
            <><span className="w-1.5 h-1.5 rounded-full bg-blue-400 blink-dot" /><span className="text-slate-500">Monitoring</span></>
          )}
        </div>
      </div>

      {/* ── Scrollable Content ── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">

        {/* ── Resolved Summary ── */}
        {isResolved && (
          <div className="rounded-xl border border-green-800/40 bg-green-950/30 p-3.5 slide-in">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-green-300 mb-1">Incident Resolved</p>
                <p className="text-[11px] text-green-400/80 leading-relaxed">{analysis.resolvedSummary}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── GEMINI INTELLIGENCE SECTION ── */}
        <GeminiAnalysis
          key={consignment.id}
          consignment={consignment}
          scenarioId={scenarioId}
          disruption={disruption}
          isResolved={isResolved}
          onApproveOverride={onApproveOverride}
        />

        <SectionDivider label="Static Risk Intelligence" />

        {/* ── Risk Analysis ── */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Risk Analysis</h3>
            {highRiskCount > 0 && !isResolved && (
              <span className="badge-critical px-2 py-0.5 rounded-md text-[10px] font-semibold">{highRiskCount} HIGH</span>
            )}
            {isResolved && <span className="text-[10px] text-green-400 font-medium">All Clear</span>}
          </div>
          <div className="space-y-2">
            {riskItems.map((item, i) => (
              <div key={i} className={isResolved ? 'opacity-40' : ''}>
                <RiskCard item={item} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Recommended Actions ── */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Recommended Actions</h3>
            <span className={`text-[10px] font-medium ${allApproved ? 'text-green-400' : 'text-slate-600'}`}>
              {approvedCount}/{actions.length} approved
            </span>
          </div>
          <div className="space-y-2">
            {actions.map((action) => (
              <ActionCard key={action.id} action={action} onApprove={handleApprove} disabled={isAnalyzing} />
            ))}
          </div>
        </div>

        {/* ── Dispatch Overrides ── */}
        <div>
          <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Dispatch Overrides</h3>
          <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-4 text-center">
            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center mx-auto mb-2
              ${autonomousEnabled ? 'bg-blue-600/20 border-blue-500/40' : 'bg-slate-800 border-slate-700'}`}>
              <Zap className={`w-4 h-4 ${autonomousEnabled ? 'text-blue-400' : 'text-slate-500'}`} />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Autonomous override mode is{' '}
              <span className={autonomousEnabled ? 'text-blue-400 font-medium' : 'text-amber-400'}>
                {autonomousEnabled ? 'active' : 'standby'}
              </span>.
              {!autonomousEnabled && <><br />Approve actions above to activate.</>}
            </p>
            <button id="enable-autonomous-mode-btn"
              onClick={() => setAutonomousEnabled((v) => !v)}
              disabled={!allApproved && !autonomousEnabled}
              className={`mt-3 px-4 py-2 rounded-lg text-xs font-medium border transition-all duration-200
                ${autonomousEnabled
                  ? 'bg-blue-600/20 border-blue-500/40 text-blue-300 hover:bg-blue-600/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}>
              {autonomousEnabled ? 'Disable Autonomous Mode' : 'Enable Autonomous Mode'}
            </button>
          </div>
        </div>

        {/* ── AI Confidence ── */}
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">AI Confidence</span>
            <span className={`text-xs font-bold ${isResolved ? 'text-green-400' : 'text-emerald-400'}`}>
              {isResolved ? '99.1%' : '94.2%'}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-700"
              style={{ width: isResolved ? '99.1%' : '94.2%' }} />
          </div>
          <p className="text-[10px] text-slate-600 mt-2">
            {isResolved
              ? 'Post-resolution validation complete — corridor certified clear.'
              : 'Based on 48h historical + live IMD/NHAI feed'}
          </p>
        </div>
      </div>
    </aside>
  );
}
