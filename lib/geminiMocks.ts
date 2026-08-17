import type { GeminiAnalysisResult } from './geminiTypes';

// ─── Pre-calculated mock responses (used when API key missing or rate-limited)
// Realistic operational data for each scenario's critical consignment.
// ──────────────────────────────────────────────────────────────────────────

export const MOCK_RESPONSES: Record<string, GeminiAnalysisResult> = {

  'nh48-flood': {
    risk_assessment: {
      breach_probability: 0.92,
      severity: 'CRITICAL',
      time_to_breach_hours: 2.5,
      financial_exposure_inr: 1680000,
      summary:
        'NH-48 flash flooding has rendered 13 km of the Pune–Mumbai expressway impassable, halting FP-2201 with 48 km remaining. SLA window for Tata Motors Pimpri plant closes in 2h 30m, placing ₹1.68 Cr of penalty exposure at immediate risk.',
    },
    mitigation_options: [
      {
        rank: 1,
        label: 'Primary AI Recommendation',
        strategy: 'Emergency Reroute — NH-160 Nashik Spur',
        operational_cost_inr: 38000,
        delay_impact_minutes: 130,
        net_savings_inr: 420000,
        feasibility: 'HIGH',
        action_steps: [
          'Dispatch immediate U-turn directive to driver at GPS coordinates 18.989°N, 73.12°E via fleet telematics',
          'Book priority dock slot at Tata Motors Pimpri (Dock 7-B) for T+3h 15m window via GEMS portal',
          'Notify Tata Motors Plant Head via auto-generated advisory SMS with revised ETA and cause code NH-FL-48',
        ],
      },
      {
        rank: 2,
        label: 'Alternative Strategy',
        strategy: 'Staged Hold — Await NHAI Clearance at Khopoli',
        operational_cost_inr: 12000,
        delay_impact_minutes: 360,
        net_savings_inr: 180000,
        feasibility: 'MEDIUM',
        action_steps: [
          'Direct driver to Khopoli truck layby (NH-48, km 54) for safe holding position',
          'File NHAI real-time clearance monitoring request for NH-48 km 58–71 flood corridor',
          'Trigger Clause 8.2 Force Majeure SLA waiver with Tata Motors to cap penalty at ₹3.5L',
        ],
      },
    ],
    driver_dispatch_memo:
      'DISPATCH ALERT — FP-2201 | Ref: INC-NH48-2608\n\nDue to IMD Red Alert flash flooding on NH-48 (km 58–71), your current route is blocked. You are instructed to execute an immediate U-turn at the next safe turnaround point and reroute via NH-160 toward Nashik, then proceed south on NH-61 to Pune Pimpri. Expected additional travel: 112 km / 2h 10m. Revised ETA at Tata Motors Dock 7-B: 19:45 IST. Confirm acknowledgement on fleet console within 5 minutes.',
    customer_status_advisory:
      'TATA MOTORS [FP-2201]: Route disruption NH-48 flooding. Rerouting via NH-160. Revised ETA 19:45 IST (+2h10m). SLA waiver initiated. -FleetPulse',
  },

  'nh44-breakdown': {
    risk_assessment: {
      breach_probability: 0.87,
      severity: 'CRITICAL',
      time_to_breach_hours: 1.5,
      financial_exposure_inr: 950000,
      summary:
        'FP-3301 has suffered a coolant system failure on NH-44 (km 312), stranding 14T of Reliance Retail cold-chain cargo 22 km from Nagpur DC. Cold-chain integrity breach is projected within 3 hours, compounding SLA breach risk to ₹9.5L in combined penalties.',
    },
    mitigation_options: [
      {
        rank: 1,
        label: 'Primary AI Recommendation',
        strategy: 'Deploy Backup Vehicle FP-4407 from Nagpur Depot',
        operational_cost_inr: 45000,
        delay_impact_minutes: 165,
        net_savings_inr: 320000,
        feasibility: 'HIGH',
        action_steps: [
          'Dispatch FP-4407 (reefer-capable, 20T capacity) from Nagpur depot immediately — ETA to breakdown site: 35 min',
          'Coordinate cargo transfer with FP-3301 driver and NHAI rescue crew; maintain reefer temp ≤4°C throughout',
          'File Reliance Retail SLA breach notification (Code: BREAKDOWN-MECH) with updated delivery ETA of 21:30 IST',
        ],
      },
      {
        rank: 2,
        label: 'Alternative Strategy',
        strategy: 'On-Site Emergency Repair via NHAI Mechanical',
        operational_cost_inr: 22000,
        delay_impact_minutes: 300,
        net_savings_inr: 120000,
        feasibility: 'MEDIUM',
        action_steps: [
          'Request NHAI breakdown recovery truck (already dispatched, ETA 90 min) to attempt coolant system patch',
          'Source emergency coolant refill from nearest authorized Ashok Leyland service center (Nagpur North, 18 km)',
          'Activate portable reefer generator from Nagpur depot to maintain cold-chain during repair window',
        ],
      },
    ],
    driver_dispatch_memo:
      'BREAKDOWN RESPONSE — FP-3301 | Ref: INC-NH44-MECH-2608\n\nNHAI rescue truck is en route (ETA 35 min). A backup vehicle FP-4407 has been dispatched from Nagpur depot to execute cargo transfer. Do NOT switch off reefer unit — maintain auxiliary power from cab battery. Ensure all cargo manifest documents are accessible for transfer. Lock and secure vehicle once cargo is transferred. Safety priority: do not attempt roadside repairs on NH-44 carriageway.',
    customer_status_advisory:
      'RELIANCE RETAIL [FP-3301]: Vehicle breakdown NH-44 km312. Backup dispatched. Cold-chain maintained. Revised ETA 21:30 IST. Updates every 30min. -FleetPulse',
  },

  'jnpt-gridlock': {
    risk_assessment: {
      breach_probability: 0.95,
      severity: 'CRITICAL',
      time_to_breach_hours: 1.2,
      financial_exposure_inr: 4800000,
      summary:
        'FP-4401 carrying Foxconn iPhone PCBs is trapped in an 8-hour JNPT Gate 5 queue with vessel departure at 03:00 IST. The customs cut-off window closes at 01:30 IST — just 72 minutes away — placing ₹4.8 Cr of export revenue and vessel rebooking penalties at immediate risk.',
    },
    mitigation_options: [
      {
        rank: 1,
        label: 'Primary AI Recommendation',
        strategy: 'Activate JNPT Priority Clearance Protocol (PCP)',
        operational_cost_inr: 22000,
        delay_impact_minutes: 45,
        net_savings_inr: 1200000,
        feasibility: 'HIGH',
        action_steps: [
          'Submit Priority Clearance Protocol request via JNPT Port Authority API (endpoint: pcp.jnpt.gov.in) — approval SLA: 12 min',
          'Pre-submit all customs documentation digitally via ICEGATE portal to eliminate manual processing at gate',
          'Coordinate with Foxconn Export Coordinator to confirm Bill of Lading endorsement and container seal number',
        ],
      },
      {
        rank: 2,
        label: 'Alternative Strategy',
        strategy: 'Emergency Diversion to Mundra Port',
        operational_cost_inr: 185000,
        delay_impact_minutes: 840,
        net_savings_inr: 380000,
        feasibility: 'MEDIUM',
        action_steps: [
          'Re-route FP-4401 to Adani Mundra Port (NH-48, 380 km) — next available Apple-approved vessel: 19-Aug 06:00 IST',
          'Coordinate with Foxconn Global Logistics for export documentation amendment (Port of Loading change)',
          'File cargo re-manifest with customs and initiate insurance rider for 14h delay exposure on high-value PCBs',
        ],
      },
    ],
    driver_dispatch_memo:
      'PRIORITY EXPORT ALERT — FP-4401 | Ref: INC-JNPT-PCP-2608\n\nPriority Clearance Protocol has been activated with JNPT Port Authority. You will be directed to the PCP express lane at Gate 5 — follow lane marshal instructions. Do NOT join standard queue. All customs documents have been pre-submitted electronically. Your estimated gate clearance time is 01:15 IST. Vessel MV Cosco Shanghai departs 03:00 IST from Berth 5. Confirm console acknowledgement immediately.',
    customer_status_advisory:
      'FOXCONN EXPORT [FP-4401]: JNPT Priority Lane activated. Customs pre-cleared. Gate clearance 01:15 IST. Vessel boarding on schedule. -FleetPulse',
  },
};

// Fallback for non-critical / unknown consignment IDs
export const DEFAULT_MOCK: GeminiAnalysisResult = {
  risk_assessment: {
    breach_probability: 0.34,
    severity: 'MEDIUM',
    time_to_breach_hours: 6.0,
    financial_exposure_inr: 280000,
    summary:
      'Consignment is currently on track with moderate delay risk. Proactive monitoring is recommended given active disruption in adjacent corridors.',
  },
  mitigation_options: [
    {
      rank: 1,
      label: 'Primary AI Recommendation',
      strategy: 'Proactive ETA Update & Stakeholder Notification',
      operational_cost_inr: 0,
      delay_impact_minutes: 0,
      net_savings_inr: 280000,
      feasibility: 'HIGH',
      action_steps: [
        'Broadcast real-time ETA update to consignee via FleetPulse automated advisory',
        'Enable geo-fence alert on final 50 km stretch for proactive dock slot management',
        'Monitor NHAI incident feed for NH corridor updates every 15 minutes',
      ],
    },
    {
      rank: 2,
      label: 'Alternative Strategy',
      strategy: 'Pre-position Reserve Vehicle at Midpoint',
      operational_cost_inr: 8000,
      delay_impact_minutes: 30,
      net_savings_inr: 180000,
      feasibility: 'MEDIUM',
      action_steps: [
        'Identify nearest idle fleet vehicle within 50 km of current truck position',
        'Place vehicle on 30-minute standby status for rapid deployment if primary breaks down',
        'Pre-alert destination dock supervisor of potential delay scenario',
      ],
    },
  ],
  driver_dispatch_memo:
    'STATUS UPDATE — Active Monitoring\n\nYour consignment is proceeding on schedule. Continue on current route. Report any route obstructions, vehicle anomalies, or estimated delay changes via fleet console immediately. Next mandatory check-in: 30 minutes.',
  customer_status_advisory:
    'FleetPulse: Your consignment is on schedule. Real-time tracking available. Expected delivery as per ETA. -FleetPulse AI',
};
