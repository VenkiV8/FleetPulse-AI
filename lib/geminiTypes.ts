// ─── Gemini AI Response Types for FleetPulse AI ───────────────────────────

export type GeminiSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type GeminiFeasibility = 'HIGH' | 'MEDIUM' | 'LOW';

export interface GeminiRiskAssessment {
  breach_probability: number;          // 0.0 – 1.0
  severity: GeminiSeverity;
  time_to_breach_hours: number;        // floating point hours
  financial_exposure_inr: number;      // integer INR
  summary: string;                     // 2-sentence human-readable assessment
}

export interface GeminiMitigationOption {
  rank: 1 | 2;
  label: string;                       // "Primary AI Recommendation" | "Alternative Strategy"
  strategy: string;                    // short strategy name
  operational_cost_inr: number;        // cost to execute this option
  delay_impact_minutes: number;        // net additional delay
  net_savings_inr: number;             // penalty avoided minus operational cost
  feasibility: GeminiFeasibility;
  action_steps: string[];              // 3 concrete steps
}

export interface GeminiAnalysisResult {
  risk_assessment: GeminiRiskAssessment;
  mitigation_options: [GeminiMitigationOption, GeminiMitigationOption];
  driver_dispatch_memo: string;        // formal dispatch note to the driver
  customer_status_advisory: string;   // ≤160 char SMS for the customer/consignee
}

// ── Request body sent from frontend ────────────────────────────────────────
export interface CopilotRequestBody {
  scenarioId: string;
  consignmentId: string;
  client: string;
  route: string;
  cargo: string;
  disruption: string;
  delay: string | null;
  status: string;
  telemetry: {
    speed: number;
    fuel: number;
    distanceRemaining: number;
    eta: string;
  };
  origin: string;
  destination: string;
  hazardLocation: string;
}
