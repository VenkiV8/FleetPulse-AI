'use client';

import { useState, useEffect, useRef } from 'react';
import { Cpu, ChevronDown, Zap, AlertTriangle, HelpCircle } from 'lucide-react';
import type { Scenario } from '@/lib/types';

interface HeaderProps {
  scenarios: Scenario[];
  activeScenarioId: string;
  onScenarioChange: (id: string) => void;
  showDropdownPulse?: boolean;
  onOpenGuide?: () => void;
}

function LiveClock() {
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');

  useEffect(() => {
    function tick() {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
          timeZone: 'Asia/Kolkata',
        })
      );
      setDate(
        now.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          timeZone: 'Asia/Kolkata',
        })
      );
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-end">
      <span className="font-mono text-lg font-semibold text-slate-100 tabular-nums tracking-wider leading-none">
        {time || '——:——:——'}
      </span>
      <span className="text-xs text-slate-500 mt-0.5">{date || '—'} IST</span>
    </div>
  );
}

export default function Header({ scenarios, activeScenarioId, onScenarioChange, showDropdownPulse = false, onOpenGuide }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeScenario = scenarios.find((s) => s.id === activeScenarioId);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md">
      <div className="px-4 lg:px-6 h-14 flex items-center justify-between gap-4">
        {/* ── Logo ── */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
            <Cpu className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-semibold text-sm text-slate-100 tracking-tight whitespace-nowrap">
              FleetPulse AI
            </span>
            <span className="text-[10px] text-slate-500 tracking-wide uppercase hidden sm:block">
              Autonomous Dispatch Tower
            </span>
          </div>
        </div>

        {/* ── Center: Live Status Dot ── */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 blink-dot" />
          <span>Systems Operational</span>
        </div>

        {/* ── Right: Disruption Dropdown + Clock ── */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Simulate Disruption Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              id="simulate-disruption-btn"
              onClick={() => setIsOpen(!isOpen)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                         bg-amber-500/10 border border-amber-500/30 text-amber-400
                         hover:bg-amber-500/20 hover:border-amber-500/50
                         transition-all duration-200 whitespace-nowrap
                         ${showDropdownPulse
                           ? 'animate-pulse ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-950'
                           : ''
                         }`}
              aria-haspopup="listbox"
              aria-expanded={isOpen}
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:block">
                {activeScenario ? activeScenario.label : 'Simulate Disruption'}
              </span>
              <span className="sm:hidden">Disruption</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-slate-700 
                           bg-slate-900 shadow-2xl shadow-black/60 overflow-hidden z-50 slide-in"
                role="listbox"
              >
                <div className="px-3 py-2 border-b border-slate-800">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
                    Select Disruption Scenario
                  </p>
                </div>
                {scenarios.map((scenario) => (
                  <button
                    key={scenario.id}
                    id={`scenario-${scenario.id}`}
                    role="option"
                    aria-selected={activeScenarioId === scenario.id}
                    onClick={() => {
                      onScenarioChange(scenario.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors duration-150
                      ${activeScenarioId === scenario.id
                        ? 'bg-blue-600/15 text-slate-100'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                      }`}
                  >
                    <Zap
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        activeScenarioId === scenario.id ? 'text-blue-400' : 'text-amber-500'
                      }`}
                    />
                    <span className="text-sm leading-snug">{scenario.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Guide Button */}
          {onOpenGuide && (
            <button
              id="reopen-guide-btn"
              onClick={onOpenGuide}
              title="Re-open evaluator guide"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
                         bg-slate-800/80 border border-slate-700/60 text-slate-400
                         hover:text-slate-200 hover:bg-slate-700/80 hover:border-slate-600
                         transition-all duration-150"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:block">Guide</span>
            </button>
          )}

          {/* Live Clock */}
          <LiveClock />
        </div>
      </div>
    </header>
  );
}
