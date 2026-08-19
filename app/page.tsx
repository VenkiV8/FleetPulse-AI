'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { ChevronRight, X, Sparkles } from 'lucide-react';
import Header from '@/components/Header';
import KPIBar from '@/components/KPIBar';
import ConsignmentQueue from '@/components/ConsignmentQueue';
import MapPanel from '@/components/MapPanel';
import AICopilot from '@/components/AICopilot';
import ActionToast, { type ToastPayload } from '@/components/ActionToast';
import WelcomeModal from '@/components/WelcomeModal';
import type { GeminiMitigationOption } from '@/lib/geminiTypes';
import { scenarios, aiAnalysisMap, kpiData, defaultScenarioId } from '@/lib/mockData';

// How long the AI "analyzing" loading state shows for (ms)
const ANALYZING_DURATION_MS = 2400;

// ── Evaluator Quick-Start Tour Steps ──────────────────────────────────────
const TOUR_STEPS = [
  { num: 1, label: 'Select Disruption Scenario', desc: 'Trigger a real-world B2B corridor hazard' },
  { num: 2, label: 'Review AI Trade-Off Matrix', desc: 'Compare cost vs. SLA penalty avoidance' },
  { num: 3, label: 'Authorize Dispatch Override', desc: 'Execute human-in-the-loop decision' },
] as const;

export default function DashboardPage() {
  // Welcome modal — open by default on first visit
  const [isModalOpen, setIsModalOpen] = useState(true);

  const [activeScenarioId, setActiveScenarioId] = useState(defaultScenarioId);
  const [selectedConsignmentId, setSelectedConsignmentId] = useState<string>('');

  // Track active/hovered strategy for map preview ('OPT-1' | 'OPT-2' | null)
  const [hoveredStrategyId, setHoveredStrategyId] = useState<'OPT-1' | 'OPT-2' | null>(null);

  // Per-consignment resolution/mitigation state: id → boolean
  const [resolvedMap, setResolvedMap] = useState<Record<string, boolean>>({});

  // Dynamic KPI extra savings accumulator
  const [extraSavingsInr, setExtraSavingsInr] = useState<number>(0);

  // Active Toast notification payload
  const [activeToast, setActiveToast] = useState<ToastPayload | null>(null);

  // AI copilot loading state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const analyzingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Cold-start evaluator banner state ──────────────────────────────────
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [hasInteractedWithScenario, setHasInteractedWithScenario] = useState(false);

  // Hydrate dismiss state from localStorage (client-only)
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && localStorage.getItem('fp-evaluator-banner-dismissed') === '1') {
        setIsBannerDismissed(true);
      }
    } catch { /* SSR or private-mode */ }
  }, []);

  const handleDismissBanner = useCallback(() => {
    setIsBannerDismissed(true);
    try { localStorage.setItem('fp-evaluator-banner-dismissed', '1'); } catch { /* noop */ }
  }, []);

  // ── Derived active scenario ──────────────────────────────────────────────
  const activeScenario = useMemo(
    () => scenarios.find((s) => s.id === activeScenarioId)!,
    [activeScenarioId]
  );

  // ── Auto-select the CRITICAL consignment when scenario changes ───────────
  const resolvedSelectedId = useMemo(() => {
    const criticalFirst = activeScenario.consignments.find((c) => c.status === 'CRITICAL');
    const firstConsignment = activeScenario.consignments[0];
    const defaultId = criticalFirst?.id ?? firstConsignment?.id ?? '';

    if (!selectedConsignmentId || !activeScenario.consignments.find((c) => c.id === selectedConsignmentId)) {
      return defaultId;
    }
    return selectedConsignmentId;
  }, [activeScenario, selectedConsignmentId]);

  const selectedConsignment = useMemo(
    () => activeScenario.consignments.find((c) => c.id === resolvedSelectedId)!,
    [activeScenario, resolvedSelectedId]
  );

  const aiAnalysis = useMemo(() => aiAnalysisMap[activeScenarioId], [activeScenarioId]);

  // Is the currently-selected consignment resolved / mitigated?
  const isCurrentResolved = resolvedMap[resolvedSelectedId] ?? false;

  // ── Scenario switch handler ──────────────────────────────────────────────
  const handleScenarioChange = useCallback((id: string) => {
    if (id === activeScenarioId) return;

    if (analyzingTimer.current) clearTimeout(analyzingTimer.current);

    setIsAnalyzing(true);
    setActiveScenarioId(id);
    setSelectedConsignmentId(''); // reset → auto-selects CRITICAL
    setHoveredStrategyId(null);
    setHasInteractedWithScenario(true); // Stop dropdown pulse animation

    // Clear resolved state for old scenario consignments
    setResolvedMap({});

    analyzingTimer.current = setTimeout(() => {
      setIsAnalyzing(false);
    }, ANALYZING_DURATION_MS);
  }, [activeScenarioId]);

  // Consignment switch within same scenario
  const handleConsignmentSelect = useCallback((id: string) => {
    if (id === resolvedSelectedId) return;
    if (analyzingTimer.current) clearTimeout(analyzingTimer.current);
    setIsAnalyzing(true);
    setSelectedConsignmentId(id);
    setHoveredStrategyId(null);
    analyzingTimer.current = setTimeout(() => setIsAnalyzing(false), 1200);
  }, [resolvedSelectedId]);

  // ── Manual toggle resolution ─────────────────────────────────────────────
  const handleToggleResolution = useCallback((consignmentId: string) => {
    setResolvedMap((prev) => {
      const nextVal = !prev[consignmentId];
      if (nextVal) {
        setExtraSavingsInr((s) => s + 420000);
      }
      return { ...prev, [consignmentId]: nextVal };
    });
  }, []);

  // ── Human-in-the-Loop: One-Click Dispatch Override Approval ──────────────
  const handleApproveDispatchOverride = useCallback((option: GeminiMitigationOption) => {
    if (!selectedConsignment) return;

    const savings = option.net_savings_inr || 420000;

    // 1. Update consignment status to MITIGATED / resolved (updates badge & triggers green bypass on Leaflet map)
    setResolvedMap((prev) => ({ ...prev, [selectedConsignment.id]: true }));
    setHoveredStrategyId(null);

    // 2. Increment Avoided Penalties KPI dynamically
    setExtraSavingsInr((prev) => prev + savings);

    // 3. Trigger confirmation Toast
    setActiveToast({
      id: `toast-${Date.now()}`,
      truckId: selectedConsignment.id,
      client: selectedConsignment.client,
      strategy: option.strategy,
      savingsInr: savings,
      route: selectedConsignment.route,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST',
    });
  }, [selectedConsignment]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (analyzingTimer.current) clearTimeout(analyzingTimer.current); };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
      {/* ── Sticky Top Bar ── */}
      <Header
        scenarios={scenarios}
        activeScenarioId={activeScenarioId}
        onScenarioChange={handleScenarioChange}
        showDropdownPulse={!hasInteractedWithScenario}
        onOpenGuide={() => setIsModalOpen(true)}
      />

      {/* ── Executive KPI Bar with dynamic savings accumulator ── */}
      <KPIBar
        data={kpiData}
        extraSavingsInr={extraSavingsInr}
      />

      {/* ── Evaluator Quick-Start Tour Banner ── */}
      {!isBannerDismissed && (
        <div className="mx-4 lg:mx-6 mb-1 mt-1">
          <div className="relative bg-slate-900/90 border border-indigo-500/30 rounded-xl p-3 flex items-center gap-4 overflow-hidden">
            {/* Subtle gradient shimmer background */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 via-transparent to-indigo-600/5 pointer-events-none" />

            {/* Title badge */}
            <div className="relative flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/15 border border-indigo-500/25">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[10px] font-bold tracking-widest uppercase text-indigo-300">
                  Evaluator Quick-Start Tour
                </span>
              </div>
            </div>

            {/* Steps */}
            <div className="relative flex items-center gap-1.5 flex-1 min-w-0">
              {TOUR_STEPS.map((step, i) => (
                <div key={step.num} className="flex items-center gap-1.5">
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/40 shrink-0">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-[10px] font-bold text-indigo-300">
                      {step.num}
                    </span>
                    <div className="flex flex-col leading-none">
                      <span className="text-xs font-medium text-slate-200 whitespace-nowrap">{step.label}</span>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap hidden xl:block">{step.desc}</span>
                    </div>
                  </div>
                  {i < TOUR_STEPS.length - 1 && (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  )}
                </div>
              ))}
            </div>

            {/* Close button */}
            <button
              id="dismiss-evaluator-banner"
              onClick={handleDismissBanner}
              className="relative z-10 p-1 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-colors duration-150 shrink-0"
              aria-label="Dismiss evaluator tour banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-hidden">
        <div className="flex flex-col lg:flex-row h-full lg:h-[calc(100vh-112px)]">

          {/* ── LEFT: Active Consignments (w-1/4) ── */}
          <div className="order-3 lg:order-1 w-full lg:w-1/4 lg:h-full border-t lg:border-t-0 lg:border-r border-slate-800/70 bg-slate-900/40 overflow-hidden flex flex-col">
            <ConsignmentQueue
              consignments={activeScenario.consignments}
              selectedId={resolvedSelectedId}
              resolvedMap={resolvedMap}
              onSelect={handleConsignmentSelect}
            />
          </div>

          {/* ── CENTER: Map & Telemetry (w-2/4) ── */}
          <div className="order-1 lg:order-2 w-full lg:w-2/4 lg:h-full border-b lg:border-b-0 lg:border-r border-slate-800/70 bg-slate-950/80 overflow-hidden flex flex-col">
            {selectedConsignment && (
              <MapPanel
                consignment={selectedConsignment}
                isResolved={isCurrentResolved}
                onToggleResolution={() => handleToggleResolution(resolvedSelectedId)}
                hoveredStrategyId={hoveredStrategyId}
                onHoverStrategy={setHoveredStrategyId}
              />
            )}
          </div>

          {/* ── RIGHT: AI Copilot (w-1/4) ── */}
          <div className="order-2 lg:order-3 w-full lg:w-1/4 lg:h-full border-b lg:border-b-0 border-slate-800/70 bg-slate-900/40 overflow-hidden flex flex-col">
            {selectedConsignment && (
              <AICopilot
                key={activeScenarioId}
                analysis={aiAnalysis}
                isAnalyzing={isAnalyzing}
                isResolved={isCurrentResolved}
                consignment={selectedConsignment}
                scenarioId={activeScenarioId}
                disruption={activeScenario.disruption}
                onApproveOverride={handleApproveDispatchOverride}
                hoveredStrategyId={hoveredStrategyId}
                onHoverStrategy={setHoveredStrategyId}
              />
            )}
          </div>
        </div>
      </main>

      {/* ── Action Toast Notification ── */}
      <ActionToast
        toast={activeToast}
        onDismiss={() => setActiveToast(null)}
      />

      {/* ── Welcome / Onboarding Modal ── */}
      <WelcomeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
