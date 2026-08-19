'use client';

import { useEffect, useState } from 'react';
import { Cpu, Radio, Zap, ShieldCheck, ArrowRight } from 'lucide-react';

// ── Feature list ──────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Radio,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
    title: 'Live Fleet Telematics',
    desc: 'Monitor active long-haul trucks across key Indian transit corridors in real time.',
  },
  {
    icon: Zap,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    title: 'AI Disruption Reasoning',
    desc: 'Trigger simulated highway hazards and let Gemini evaluate cost-vs-SLA trade-offs.',
  },
  {
    icon: ShieldCheck,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    title: 'Human-in-the-Loop Governance',
    desc: 'Review itemized savings and authorize one-click dispatch overrides.',
  },
] as const;

// ── Props ─────────────────────────────────────────────────────────────────
interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────
export default function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  // Drives the CSS transition — separate from isOpen so the fade-out plays
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Build class strings without template literals to keep PowerShell-safe
  const backdropCls =
    'fixed inset-0 z-50 flex items-center justify-center p-4 ' +
    'bg-slate-950/75 backdrop-blur-md transition-opacity duration-300 ' +
    (visible ? 'opacity-100' : 'opacity-0');

  const cardCls =
    'relative max-w-lg w-full bg-slate-900/95 border border-slate-700/80 ' +
    'rounded-2xl shadow-2xl shadow-black/60 p-6 md:p-8 text-center ' +
    'transition-all duration-300 ' +
    (visible ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0');

  return (
    <div
      className={backdropCls}
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-modal-title"
    >
      <div className={cardCls}>

        {/* Ambient gradient overlay */}
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-blue-500/10 via-transparent to-indigo-500/10 pointer-events-none" />
        {/* Top highlight line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

        {/* ── Logo + Badge + Title ── */}
        <div className="relative flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/15 border border-blue-500/25 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/10">
            <Cpu className="w-7 h-7 text-blue-400" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shrink-0" />
            FleetPulse AI &bull; Executive Proof of Concept
          </span>

          <h1
            id="welcome-modal-title"
            className="text-xl md:text-2xl font-bold text-slate-100 leading-tight"
          >
            Autonomous Dispatch &amp;{' '}
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Exception Copilot
            </span>
          </h1>
        </div>

        {/* ── Body Copy ── */}
        <p className="relative text-sm text-slate-400 leading-relaxed mb-6 px-2">
          Welcome to the Fleet Operations Control Tower. This application demonstrates
          real-time predictive exception handling and automated rerouting for
          high-value B2B freight corridors.
        </p>

        {/* ── Feature Pills ── */}
        <div className="relative space-y-2.5 mb-7 text-left">
          {FEATURES.map(({ icon: Icon, color, bg, title, desc }) => (
            <div
              key={title}
              className={'flex items-start gap-3 px-3.5 py-3 rounded-xl border ' + bg}
            >
              <div className={'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ' + bg}>
                <Icon className={'w-4 h-4 ' + color} />
              </div>
              <div className="min-w-0">
                <p className={'text-xs font-semibold leading-none mb-0.5 ' + color}>{title}</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── CTA Button ── */}
        <button
          id="welcome-modal-launch-btn"
          onClick={onClose}
          className="relative w-full py-3 px-6 rounded-xl font-semibold text-sm text-white
                     bg-gradient-to-r from-blue-600 to-indigo-600
                     hover:from-blue-500 hover:to-indigo-500
                     shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40
                     transition-all duration-200 hover:scale-[1.02] active:scale-[0.99]
                     flex items-center justify-center gap-2"
        >
          Launch Control Tower
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="relative text-[10px] text-slate-600 mt-3">
          Demo environment &mdash; no real freight data
        </p>
      </div>
    </div>
  );
}
