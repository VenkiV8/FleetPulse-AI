'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import KPIBar from '@/components/KPIBar';
import ConsignmentQueue from '@/components/ConsignmentQueue';
import MapPanel from '@/components/MapPanel';
import AICopilot from '@/components/AICopilot';
import ActionToast, { type ToastPayload } from '@/components/ActionToast';
import type { GeminiMitigationOption } from '@/lib/geminiTypes';
import { scenarios, aiAnalysisMap, kpiData, defaultScenarioId } from '@/lib/mockData';

// How long the AI "analyzing" loading state shows for (ms)
const ANALYZING_DURATION_MS = 2400;

export default function DashboardPage() {
  const [activeScenarioId, setActiveScenarioId] = useState(defaultScenarioId);
  const [selectedConsignmentId, setSelectedConsignmentId] = useState<string>('');

  // Per-consignment resolution/mitigation state: id → boolean
  const [resolvedMap, setResolvedMap] = useState<Record<string, boolean>>({});

  // Dynamic KPI extra savings accumulator
  const [extraSavingsInr, setExtraSavingsInr] = useState<number>(0);

  // Active Toast notification payload
  const [activeToast, setActiveToast] = useState<ToastPayload | null>(null);

  // AI copilot loading state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const analyzingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      />

      {/* ── Executive KPI Bar with dynamic savings accumulator ── */}
      <KPIBar
        data={kpiData}
        extraSavingsInr={extraSavingsInr}
      />

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
    </div>
  );
}
