'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  X,
  Send,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  MapPin,
} from 'lucide-react';

export interface ToastPayload {
  id: string;
  truckId: string;
  client: string;
  strategy: string;
  savingsInr: number;
  route: string;
  timestamp: string;
}

interface ActionToastProps {
  toast: ToastPayload | null;
  onDismiss: () => void;
}

function formatInr(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export default function ActionToast({ toast, onDismiss }: ActionToastProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!toast) return;
    setProgress(100);

    const startTime = Date.now();
    const duration = 6500;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (elapsed >= duration) {
        clearInterval(interval);
        onDismiss();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-auto">
      <div className="relative rounded-2xl bg-slate-900/95 border border-emerald-500/40 p-4 shadow-[0_0_30px_rgba(16,185,129,0.25)] backdrop-blur-md overflow-hidden">
        {/* Top Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="flex items-start gap-3 pt-1">
          {/* Pulsing Icon */}
          <div className="relative shrink-0 mt-0.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping opacity-75" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  Dispatch Override Authorized
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  {toast.truckId}
                </span>
              </div>
              <button
                onClick={onDismiss}
                className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-md hover:bg-slate-800"
                aria-label="Dismiss toast"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Main Message */}
            <p className="text-xs font-semibold text-slate-100 leading-snug mb-1">
              Route re-routed via {toast.strategy}.
            </p>
            <p className="text-[11px] text-slate-300 leading-relaxed mb-2.5">
              Driver notified via SMS · Customer status advisory dispatched to {toast.client}.
            </p>

            {/* Action Meta Badges */}
            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
                <TrendingUp className="w-3 h-3" />
                +{formatInr(toast.savingsInr)} Avoided Penalties
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
                <Send className="w-2.5 h-2.5" />
                SMS Sent
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/25">
                <ShieldCheck className="w-3 h-3" />
                SLA Protected
              </span>
            </div>
          </div>
        </div>

        {/* Footer timestamp */}
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-slate-500 font-mono">
          <span>Auth Token: FP-GOV-{Math.random().toString(36).substring(2, 8).toUpperCase()}</span>
          <span>{toast.timestamp}</span>
        </div>
      </div>
    </div>
  );
}
