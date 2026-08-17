// ─── Core Domain Types for FleetPulse AI ───────────────────────────────────

export type ConsignmentStatus = 'ON TRACK' | 'MONITORING' | 'CRITICAL' | 'MITIGATED';

export interface Waypoint {
  lat: number;
  lng: number;
  label?: string;
}

export interface Telemetry {
  speed: number;        // km/h
  fuel: number;         // percentage
  odometer: number;     // km
  distanceRemaining: number; // km
  eta: string;          // e.g. "4h 12m"
}

export interface Consignment {
  id: string;
  client: string;
  route: string;
  cargo: string;
  status: ConsignmentStatus;
  delay: string | null;           // null = no delay
  origin: Waypoint;
  destination: Waypoint;
  truckPosition: Waypoint;
  hazardPoint: Waypoint;
  incidentRadius: number;         // metres – radius of the pulsating hazard circle
  telemetry: Telemetry;
  resolvedTelemetry: Telemetry;   // telemetry state after incident resolution
  polyline: Waypoint[];           // full route polyline
  bypassPolyline: Waypoint[];     // alternate green bypass route shown on resolution
}

export interface Scenario {
  id: string;
  label: string;
  disruption: string;
  consignments: Consignment[];
}

export interface KPIData {
  activeTrucks: number;
  fleetOTIF: string;
  atRiskConsignments: number;
  totalValueAtRisk: string;
  avoidedPenalties: string;
}

export interface AIRiskItem {
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
}

export interface AIAction {
  id: string;
  type: 'REROUTE' | 'NOTIFY' | 'ESCALATE' | 'OVERRIDE';
  label: string;
  detail: string;
  approved: boolean;
}

export interface AIAnalysis {
  riskItems: AIRiskItem[];
  actions: AIAction[];
  analyzingMessage: string;     // message shown during the loading state
  resolvedSummary: string;      // summary shown once incident is resolved
}
