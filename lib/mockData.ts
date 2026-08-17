import type { Scenario, KPIData, AIAnalysis } from './types';

// ─── KPI Data ─────────────────────────────────────────────────────────────
export const kpiData: KPIData = {
  activeTrucks: 24,
  fleetOTIF: '91.6%',
  atRiskConsignments: 3,
  totalValueAtRisk: '₹1.68 Cr',
  avoidedPenalties: '₹4.2L',
};

// ─── AI Analysis per scenario ──────────────────────────────────────────────
const nh48Analysis: AIAnalysis = {
  analyzingMessage: 'FleetPulse AI analyzing NH-48 corridor telematics…',
  resolvedSummary: 'Bypass via NH-160 activated. FP-2201 re-routed successfully. ETA revised to +2h 10m. ₹4.2L penalty exposure avoided.',
  riskItems: [
    {
      severity: 'HIGH',
      title: 'Flash Flood — NH-48 Blocked',
      description:
        'Pune–Mumbai expressway (km 58–71) is under 40 cm standing water. IMD red alert active until 23:00 IST. Estimated clearance: 6–8 hours.',
    },
    {
      severity: 'MEDIUM',
      title: 'Cargo Damage Risk',
      description:
        'FP-2201 carrying automotive sub-assemblies. Waterlogged route increases damage probability by 34%. Reroute via NH-160 adds 112 km.',
    },
    {
      severity: 'LOW',
      title: 'Adjacent Delay Cascade',
      description:
        'FP-2202 and FP-2203 share outbound depot at Bhiwandi. Delay of FP-2201 may push dock slots by 2 h.',
    },
  ],
  actions: [
    {
      id: 'a1',
      type: 'REROUTE',
      label: 'Reroute via NH-160 (Pune–Nashik)',
      detail: '+112 km · ETA shift +2h 10m · ₹3,800 fuel surcharge',
      approved: false,
    },
    {
      id: 'a2',
      type: 'NOTIFY',
      label: 'Notify Tata Motors Plant Head',
      detail: 'Auto-draft: "FP-2201 delayed 4–6h due to NH-48 flooding. Alternate route in progress."',
      approved: false,
    },
    {
      id: 'a3',
      type: 'ESCALATE',
      label: 'Escalate to Regional Transport Manager',
      detail: 'Flag for priority dock slot reallocation at Pimpri plant',
      approved: false,
    },
  ],
};

const nh44Analysis: AIAnalysis = {
  analyzingMessage: 'FleetPulse AI analyzing NH-44 breakdown telematics…',
  resolvedSummary: 'Backup vehicle FP-4407 dispatched from Nagpur depot. Cargo transfer in progress. Cold-chain integrity maintained at 4°C.',
  riskItems: [
    {
      severity: 'HIGH',
      title: 'Engine Breakdown — NH-44 Km 312',
      description:
        'Truck FP-3301 reported coolant system failure near Nagpur North. NHAI rescue truck dispatched. ETA: 90 min.',
    },
    {
      severity: 'MEDIUM',
      title: 'Cold-Chain Consignment at Risk',
      description:
        'Cargo includes perishable FMCG goods. Temp threshold breach likely within 3h if refrigeration unit loses auxiliary power.',
    },
    {
      severity: 'LOW',
      title: 'Penalty Exposure Window',
      description:
        'Reliance Retail SLA mandates delivery within 48h of loading. Current delay: 4h 20m against 2h SLA buffer.',
    },
  ],
  actions: [
    {
      id: 'b1',
      type: 'OVERRIDE',
      label: 'Deploy Backup Vehicle FP-4407',
      detail: 'Nearest idle truck at Nagpur depot (23 km away). Cargo transfer ETA: 2h 45m.',
      approved: false,
    },
    {
      id: 'b2',
      type: 'NOTIFY',
      label: 'Alert Reliance Retail DC Manager',
      detail: 'SLA breach notification with updated ETA and cargo integrity report',
      approved: false,
    },
    {
      id: 'b3',
      type: 'ESCALATE',
      label: 'File NHAI Incident Report',
      detail: 'Automated incident log for insurance and partner SLA waiver processing',
      approved: false,
    },
  ],
};

const jnptAnalysis: AIAnalysis = {
  analyzingMessage: 'FleetPulse AI analyzing JNPT port corridor telematics…',
  resolvedSummary: 'JNPT Priority Clearance Protocol activated. FP-4401 in express lane. Customs pre-clearance submitted. Vessel window secured.',
  riskItems: [
    {
      severity: 'HIGH',
      title: 'Port Gridlock — JNPT Gate 5',
      description:
        'Nhava Sheva port congestion: 8-hour queue at Gate 5. Export window for Foxconn consignment closes at 03:00 IST tomorrow.',
    },
    {
      severity: 'HIGH',
      title: 'Customs Cut-Off Breach Risk',
      description:
        'FP-4401 must clear customs by 01:30 IST to make the vessel. Current projected arrival at gate: 02:45 IST.',
    },
    {
      severity: 'MEDIUM',
      title: '₹48L Export Revenue at Stake',
      description:
        'Missing this vessel adds 4-day delay and ₹1.2L rebooking cost. Next vessel slot: 21-Aug.',
    },
  ],
  actions: [
    {
      id: 'c1',
      type: 'OVERRIDE',
      label: 'Request Priority Lane — JNPT Express',
      detail: 'Activate JNPT Priority Clearance Protocol (PCP) via Port Authority API. Cost: ₹22,000.',
      approved: false,
    },
    {
      id: 'c2',
      type: 'NOTIFY',
      label: 'Alert Foxconn Export Coordinator',
      detail: 'Send ETA update and flag customs pre-clearance docs for digital submission',
      approved: false,
    },
    {
      id: 'c3',
      type: 'REROUTE',
      label: 'Divert to Mundra Port (Contingency)',
      detail: '+380 km · +14h · Alternative vessel departs 19-Aug at 06:00. Penalty savings: ₹38L vs. delay.',
      approved: false,
    },
  ],
};

// ─── Scenario Data ─────────────────────────────────────────────────────────
export const scenarios: Scenario[] = [
  // ── SCENARIO 1: NH-48 Flash Flooding ─────────────────────────────────────
  {
    id: 'nh48-flood',
    label: 'NH-48 Flash Flooding (Tata Motors)',
    disruption: 'Flash Flooding',
    consignments: [
      {
        id: 'FP-2201',
        client: 'Tata Motors',
        route: 'Mumbai → Pune',
        cargo: 'Auto Sub-Assemblies · 18T',
        status: 'CRITICAL',
        delay: '+4h 30m',
        origin: { lat: 19.076, lng: 72.8777, label: 'Mumbai APMC' },
        destination: { lat: 18.5204, lng: 73.8567, label: 'Pune Pimpri' },
        truckPosition: { lat: 18.989, lng: 73.12 },
        hazardPoint: { lat: 18.94, lng: 73.07 },
        incidentRadius: 4200,
        telemetry: { speed: 0, fuel: 52, odometer: 78340, distanceRemaining: 48, eta: 'Delayed' },
        resolvedTelemetry: { speed: 54, fuel: 48, odometer: 78402, distanceRemaining: 112, eta: '+2h 10m' },
        polyline: [
          { lat: 19.076, lng: 72.8777 },
          { lat: 19.01, lng: 73.01 },
          { lat: 18.989, lng: 73.12 },
          { lat: 18.94, lng: 73.07 },
          { lat: 18.74, lng: 73.4 },
          { lat: 18.5204, lng: 73.8567 },
        ],
        // Bypass: NH-160 via Nashik spur (loops north around flood zone)
        bypassPolyline: [
          { lat: 18.989, lng: 73.12 },
          { lat: 19.08, lng: 73.18 },
          { lat: 19.21, lng: 73.35 },
          { lat: 19.33, lng: 73.62 },
          { lat: 19.1, lng: 73.85 },
          { lat: 18.82, lng: 74.0 },
          { lat: 18.65, lng: 73.9 },
          { lat: 18.5204, lng: 73.8567 },
        ],
      },
      {
        id: 'FP-2202',
        client: 'Tata Motors',
        route: 'Nashik → Aurangabad',
        cargo: 'Engine Components · 12T',
        status: 'MONITORING',
        delay: '+1h 10m',
        origin: { lat: 19.9975, lng: 73.7898, label: 'Nashik' },
        destination: { lat: 19.8762, lng: 75.3433, label: 'Aurangabad' },
        truckPosition: { lat: 19.95, lng: 74.2 },
        hazardPoint: { lat: 19.92, lng: 74.3 },
        incidentRadius: 2500,
        telemetry: { speed: 62, fuel: 68, odometer: 43120, distanceRemaining: 120, eta: '3h 10m' },
        resolvedTelemetry: { speed: 74, fuel: 65, odometer: 43148, distanceRemaining: 105, eta: '2h 20m' },
        polyline: [
          { lat: 19.9975, lng: 73.7898 },
          { lat: 19.95, lng: 74.2 },
          { lat: 19.9, lng: 74.75 },
          { lat: 19.8762, lng: 75.3433 },
        ],
        bypassPolyline: [
          { lat: 19.95, lng: 74.2 },
          { lat: 19.87, lng: 74.55 },
          { lat: 19.8762, lng: 75.3433 },
        ],
      },
      {
        id: 'FP-2203',
        client: 'Bosch India',
        route: 'Pune → Hyderabad',
        cargo: 'Electronic Control Units · 8T',
        status: 'ON TRACK',
        delay: null,
        origin: { lat: 18.5204, lng: 73.8567, label: 'Pune' },
        destination: { lat: 17.385, lng: 78.4867, label: 'Hyderabad' },
        truckPosition: { lat: 17.9, lng: 76.5 },
        hazardPoint: { lat: 17.8, lng: 76.8 },
        incidentRadius: 1500,
        telemetry: { speed: 74, fuel: 43, odometer: 61200, distanceRemaining: 280, eta: '5h 20m' },
        resolvedTelemetry: { speed: 74, fuel: 43, odometer: 61200, distanceRemaining: 280, eta: '5h 20m' },
        polyline: [
          { lat: 18.5204, lng: 73.8567 },
          { lat: 18.1, lng: 74.8 },
          { lat: 17.9, lng: 76.5 },
          { lat: 17.6, lng: 77.5 },
          { lat: 17.385, lng: 78.4867 },
        ],
        bypassPolyline: [
          { lat: 17.9, lng: 76.5 },
          { lat: 17.6, lng: 77.5 },
          { lat: 17.385, lng: 78.4867 },
        ],
      },
      {
        id: 'FP-2204',
        client: 'Mahindra Logistics',
        route: 'Nagpur → Mumbai',
        cargo: 'Tractor Parts · 22T',
        status: 'ON TRACK',
        delay: null,
        origin: { lat: 21.1458, lng: 79.0882, label: 'Nagpur' },
        destination: { lat: 19.076, lng: 72.8777, label: 'Mumbai' },
        truckPosition: { lat: 20.1, lng: 76.0 },
        hazardPoint: { lat: 20.0, lng: 75.8 },
        incidentRadius: 1800,
        telemetry: { speed: 81, fuel: 71, odometer: 29800, distanceRemaining: 380, eta: '6h 45m' },
        resolvedTelemetry: { speed: 81, fuel: 71, odometer: 29800, distanceRemaining: 380, eta: '6h 45m' },
        polyline: [
          { lat: 21.1458, lng: 79.0882 },
          { lat: 20.5, lng: 77.5 },
          { lat: 20.1, lng: 76.0 },
          { lat: 19.7, lng: 74.8 },
          { lat: 19.076, lng: 72.8777 },
        ],
        bypassPolyline: [
          { lat: 20.1, lng: 76.0 },
          { lat: 19.7, lng: 74.8 },
          { lat: 19.076, lng: 72.8777 },
        ],
      },
    ],
  },

  // ── SCENARIO 2: NH-44 Engine Breakdown ───────────────────────────────────
  {
    id: 'nh44-breakdown',
    label: 'NH-44 Engine Breakdown (Reliance Retail)',
    disruption: 'Engine Breakdown',
    consignments: [
      {
        id: 'FP-3301',
        client: 'Reliance Retail',
        route: 'Delhi → Nagpur',
        cargo: 'FMCG (Cold Chain) · 14T',
        status: 'CRITICAL',
        delay: '+4h 20m',
        origin: { lat: 28.6139, lng: 77.209, label: 'Delhi Gazipur' },
        destination: { lat: 21.1458, lng: 79.0882, label: 'Nagpur DC' },
        truckPosition: { lat: 21.3, lng: 79.1 },
        hazardPoint: { lat: 21.28, lng: 79.09 },
        incidentRadius: 3000,
        telemetry: { speed: 0, fuel: 38, odometer: 92400, distanceRemaining: 22, eta: 'Stranded' },
        resolvedTelemetry: { speed: 62, fuel: 71, odometer: 92423, distanceRemaining: 22, eta: '25m' },
        polyline: [
          { lat: 28.6139, lng: 77.209 },
          { lat: 26.0, lng: 78.0 },
          { lat: 23.5, lng: 78.5 },
          { lat: 21.3, lng: 79.1 },
          { lat: 21.1458, lng: 79.0882 },
        ],
        // Bypass: backup truck FP-4407 departs Nagpur depot to intercept
        bypassPolyline: [
          { lat: 21.1458, lng: 79.0882 },
          { lat: 21.2, lng: 79.09 },
          { lat: 21.28, lng: 79.09 },
          { lat: 21.3, lng: 79.1 },
        ],
      },
      {
        id: 'FP-3302',
        client: 'Reliance Retail',
        route: 'Hyderabad → Chennai',
        cargo: 'Consumer Electronics · 10T',
        status: 'MONITORING',
        delay: '+45m',
        origin: { lat: 17.385, lng: 78.4867, label: 'Hyderabad' },
        destination: { lat: 13.0827, lng: 80.2707, label: 'Chennai' },
        truckPosition: { lat: 14.5, lng: 79.8 },
        hazardPoint: { lat: 14.4, lng: 79.9 },
        incidentRadius: 2000,
        telemetry: { speed: 55, fuel: 58, odometer: 47600, distanceRemaining: 185, eta: '3h 30m' },
        resolvedTelemetry: { speed: 72, fuel: 55, odometer: 47632, distanceRemaining: 165, eta: '2h 45m' },
        polyline: [
          { lat: 17.385, lng: 78.4867 },
          { lat: 16.0, lng: 79.2 },
          { lat: 14.5, lng: 79.8 },
          { lat: 13.0827, lng: 80.2707 },
        ],
        bypassPolyline: [
          { lat: 14.5, lng: 79.8 },
          { lat: 14.1, lng: 80.0 },
          { lat: 13.0827, lng: 80.2707 },
        ],
      },
      {
        id: 'FP-3303',
        client: 'D-Mart',
        route: 'Bangalore → Coimbatore',
        cargo: 'Staples & Grocery · 16T',
        status: 'ON TRACK',
        delay: null,
        origin: { lat: 12.9716, lng: 77.5946, label: 'Bangalore' },
        destination: { lat: 11.0168, lng: 76.9558, label: 'Coimbatore' },
        truckPosition: { lat: 11.8, lng: 77.1 },
        hazardPoint: { lat: 11.75, lng: 77.0 },
        incidentRadius: 1200,
        telemetry: { speed: 68, fuel: 81, odometer: 22100, distanceRemaining: 95, eta: '1h 55m' },
        resolvedTelemetry: { speed: 68, fuel: 81, odometer: 22100, distanceRemaining: 95, eta: '1h 55m' },
        polyline: [
          { lat: 12.9716, lng: 77.5946 },
          { lat: 12.2, lng: 77.4 },
          { lat: 11.8, lng: 77.1 },
          { lat: 11.0168, lng: 76.9558 },
        ],
        bypassPolyline: [
          { lat: 11.8, lng: 77.1 },
          { lat: 11.0168, lng: 76.9558 },
        ],
      },
      {
        id: 'FP-3304',
        client: 'BigBasket',
        route: 'Pune → Mumbai',
        cargo: 'Fresh Produce · 7T',
        status: 'ON TRACK',
        delay: null,
        origin: { lat: 18.5204, lng: 73.8567, label: 'Pune' },
        destination: { lat: 19.076, lng: 72.8777, label: 'Mumbai' },
        truckPosition: { lat: 18.9, lng: 73.0 },
        hazardPoint: { lat: 18.85, lng: 73.05 },
        incidentRadius: 1000,
        telemetry: { speed: 88, fuel: 61, odometer: 8700, distanceRemaining: 55, eta: '55m' },
        resolvedTelemetry: { speed: 88, fuel: 61, odometer: 8700, distanceRemaining: 55, eta: '55m' },
        polyline: [
          { lat: 18.5204, lng: 73.8567 },
          { lat: 18.9, lng: 73.0 },
          { lat: 19.076, lng: 72.8777 },
        ],
        bypassPolyline: [
          { lat: 18.9, lng: 73.0 },
          { lat: 19.076, lng: 72.8777 },
        ],
      },
    ],
  },

  // ── SCENARIO 3: JNPT Port Gridlock ──────────────────────────────────────
  {
    id: 'jnpt-gridlock',
    label: 'JNPT Port Gridlock (Foxconn Export)',
    disruption: 'Port Gridlock',
    consignments: [
      {
        id: 'FP-4401',
        client: 'Foxconn Export',
        route: 'Chennai → JNPT',
        cargo: 'iPhone PCBs · 4T (Export)',
        status: 'CRITICAL',
        delay: '+6h (Port Queue)',
        origin: { lat: 13.0827, lng: 80.2707, label: 'Chennai SEZ' },
        destination: { lat: 18.948, lng: 72.9438, label: 'JNPT Gate 5' },
        truckPosition: { lat: 19.1, lng: 72.98 },
        hazardPoint: { lat: 18.98, lng: 72.95 },
        incidentRadius: 3500,
        telemetry: { speed: 8, fuel: 29, odometer: 134500, distanceRemaining: 6, eta: 'Queued' },
        resolvedTelemetry: { speed: 32, fuel: 27, odometer: 134504, distanceRemaining: 2, eta: '8m' },
        polyline: [
          { lat: 13.0827, lng: 80.2707 },
          { lat: 15.0, lng: 78.5 },
          { lat: 17.0, lng: 75.8 },
          { lat: 18.5, lng: 73.5 },
          { lat: 19.1, lng: 72.98 },
          { lat: 18.948, lng: 72.9438 },
        ],
        // Bypass: Priority express lane cuts directly into port
        bypassPolyline: [
          { lat: 19.1, lng: 72.98 },
          { lat: 19.05, lng: 72.965 },
          { lat: 18.99, lng: 72.948 },
          { lat: 18.948, lng: 72.9438 },
        ],
      },
      {
        id: 'FP-4402',
        client: 'Apple Logistics',
        route: 'Sriperumbudur → JNPT',
        cargo: 'MacBook Chargers · 6T',
        status: 'MONITORING',
        delay: '+2h',
        origin: { lat: 12.9601, lng: 79.9492, label: 'Sriperumbudur' },
        destination: { lat: 18.948, lng: 72.9438, label: 'JNPT' },
        truckPosition: { lat: 17.3, lng: 75.6 },
        hazardPoint: { lat: 17.2, lng: 75.7 },
        incidentRadius: 2200,
        telemetry: { speed: 71, fuel: 44, odometer: 78200, distanceRemaining: 320, eta: '6h 10m' },
        resolvedTelemetry: { speed: 78, fuel: 42, odometer: 78235, distanceRemaining: 290, eta: '5h 30m' },
        polyline: [
          { lat: 12.9601, lng: 79.9492 },
          { lat: 15.0, lng: 77.8 },
          { lat: 17.3, lng: 75.6 },
          { lat: 18.5, lng: 73.5 },
          { lat: 18.948, lng: 72.9438 },
        ],
        bypassPolyline: [
          { lat: 17.3, lng: 75.6 },
          { lat: 18.2, lng: 73.8 },
          { lat: 18.948, lng: 72.9438 },
        ],
      },
      {
        id: 'FP-4403',
        client: 'Samsung India',
        route: 'Noida → JNPT',
        cargo: 'Display Panels · 9T',
        status: 'ON TRACK',
        delay: null,
        origin: { lat: 28.5355, lng: 77.391, label: 'Noida' },
        destination: { lat: 18.948, lng: 72.9438, label: 'JNPT' },
        truckPosition: { lat: 22.0, lng: 75.8 },
        hazardPoint: { lat: 21.9, lng: 75.7 },
        incidentRadius: 1600,
        telemetry: { speed: 77, fuel: 66, odometer: 54300, distanceRemaining: 560, eta: '9h 20m' },
        resolvedTelemetry: { speed: 77, fuel: 66, odometer: 54300, distanceRemaining: 560, eta: '9h 20m' },
        polyline: [
          { lat: 28.5355, lng: 77.391 },
          { lat: 25.0, lng: 76.5 },
          { lat: 22.0, lng: 75.8 },
          { lat: 19.5, lng: 73.8 },
          { lat: 18.948, lng: 72.9438 },
        ],
        bypassPolyline: [
          { lat: 22.0, lng: 75.8 },
          { lat: 19.5, lng: 73.8 },
          { lat: 18.948, lng: 72.9438 },
        ],
      },
      {
        id: 'FP-4404',
        client: 'OnePlus Logistics',
        route: 'Hyderabad → JNPT',
        cargo: 'Handsets & Accessories · 5T',
        status: 'ON TRACK',
        delay: null,
        origin: { lat: 17.385, lng: 78.4867, label: 'Hyderabad' },
        destination: { lat: 18.948, lng: 72.9438, label: 'JNPT' },
        truckPosition: { lat: 18.2, lng: 75.2 },
        hazardPoint: { lat: 18.1, lng: 75.3 },
        incidentRadius: 1400,
        telemetry: { speed: 83, fuel: 74, odometer: 31600, distanceRemaining: 240, eta: '4h 05m' },
        resolvedTelemetry: { speed: 83, fuel: 74, odometer: 31600, distanceRemaining: 240, eta: '4h 05m' },
        polyline: [
          { lat: 17.385, lng: 78.4867 },
          { lat: 17.8, lng: 76.5 },
          { lat: 18.2, lng: 75.2 },
          { lat: 18.6, lng: 73.8 },
          { lat: 18.948, lng: 72.9438 },
        ],
        bypassPolyline: [
          { lat: 18.2, lng: 75.2 },
          { lat: 18.6, lng: 73.8 },
          { lat: 18.948, lng: 72.9438 },
        ],
      },
    ],
  },
];

export const aiAnalysisMap: Record<string, AIAnalysis> = {
  'nh48-flood': nh48Analysis,
  'nh44-breakdown': nh44Analysis,
  'jnpt-gridlock': jnptAnalysis,
};

export const defaultScenarioId = 'nh48-flood';
