# FleetPulse AI — Autonomous Logistics Control Tower

> **AI-Powered Logistics Resilience Engine** — Transforming supply chain disruptions into optimized dispatch actions in real-time with Google Gemini and interactive geospatial telematics.

---

## 🌟 Overview

**FleetPulse AI** is a dark-themed, mission-critical autonomous dispatch tower built for modern freight and fleet operations. It continuously monitors live corridors, evaluates SLA breach risks during active disruptions (such as flash floods, breakdowns, and port congestions), and uses **Google Gemini 3.6 Flash** to generate ranked mitigation strategies, dynamic cost/savings trade-off matrices, and human-in-the-loop dispatch overrides.

---

## 🚀 Key Features

### 1. Cockpit Interface & Live KPIs
- **Header & Disruption Simulator:** Instant scenario switching between three real-world Indian corridor disruptions:
  - 🌊 **NH-48 Flash Flooding** (Tata Motors / Pune–Mumbai Corridor)
  - ⚙️ **NH-44 Engine Breakdown** (Reliance Retail / Cold-Chain Freight)
  - ⚓ **JNPT Port Gridlock** (Foxconn Export / Time-Sensitive Air/Sea Transit)
- **Executive KPI Bar:** Real-time metrics tracking Active Trucks, Fleet OTIF, At-Risk Consignments, Value at Risk, and dynamically accumulating **Avoided Penalties**.

### 2. Geospatial Telematics & Interactive Leaflet Map
- **Live Corridor Mapping:** Smooth fly-to animations centering on active incidents.
- **Dynamic Polyline Routing:** Visual differentiation between travelled, blocked/incident, and active bypass routes.
- **Pulsating Hazard Zones:** Dual-ring animated Leaflet hazard perimeters indicating obstruction severity.
- **Live Speedometer & Telemetry:** Gauge charts visualizing truck speed, fuel levels, odometer, and remaining distance.

### 3. Gemini 3.6 Flash Intelligence Engine
- **Server-Side Route (`/api/copilot`):** Strict JSON schema-enforced analysis comparing operational costs vs. penalty exposure in Indian Rupees (INR).
- **Radial Breach Risk Gauge:** 270° SVG arc meter color-coded to breach probabilities.
- **Ranked Mitigation Strategies:** Primary AI Recommendation vs Alternative Strategy with detailed feasibility ratings, operational costs, delay impact, and net savings.
- **Automated Communication Drawers:** Monospace Driver Dispatch Memos (with 1-click clipboard copy) and SMS Customer Status Advisories with character limits.
- **Zero-Failure Fallback:** Pre-calculated realistic models ensure 100% demo reliability even without an active API key.

### 4. Human-in-the-Loop Governance & Actions
- **One-Click Dispatch Override:** "Approve Dispatch Override" triggers instant mitigation across the system.
- **Real-Time Toast Notifications:** Floating glassmorphic confirmation with authorization token, timestamp, and progress bar.
- **Dynamic KPI Updates:** Automatically adds net savings to the "Avoided Penalties" counter with emerald highlight animations.
- **Status Synchronization:** Seamlessly transitions shipments from **`CRITICAL`** to **`MITIGATED`** and activates glowing green bypass paths on the map.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 16 (App Router)](https://nextjs.org/)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4 & Vanilla CSS Animations
- **Geospatial Map:** [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/)
- **AI / LLM:** Google Gemini (`@google/genai` / Gemini 3.6 Flash)
- **Icons:** [Lucide React](https://lucide.dev/)

---

## 📦 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/VenkiV8/FleetPulse-AI.git
cd FleetPulse-AI
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy the example environment configuration:
```bash
cp .env.example .env.local
```
Add your Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey):
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
*(Note: If no key is provided, the application will automatically run with built-in realistic mock data).*

### 4. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
fleetpulse-ai/
├── app/
│   ├── api/copilot/route.ts  # Gemini AI analysis endpoint with JSON schema
│   ├── globals.css           # Custom theme tokens & Leaflet animations
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Cockpit container & state orchestrator
├── components/
│   ├── ActionToast.tsx       # Real-time dispatch authorization toast
│   ├── AICopilot.tsx         # AI Copilot sidebar panel
│   ├── ConsignmentQueue.tsx  # Active shipments list & status badges
│   ├── GeminiAnalysis.tsx    # Breach risk gauge, strategy cards & drawers
│   ├── Header.tsx            # Top bar & scenario switcher
│   ├── KPIBar.tsx            # Executive KPI metrics & dynamic savings
│   ├── LeafletMap.tsx        # Dynamic map with custom markers & bypass routes
│   ├── MapPanel.tsx          # Center cockpit container & telemetry
│   └── TelemetryCard.tsx     # Speedometer & truck metrics
├── lib/
│   ├── geminiMocks.ts        # Pre-calculated realistic scenario data
│   ├── geminiTypes.ts        # Gemini API request/response types
│   ├── mockData.ts           # Scenario & consignment definitions
│   └── types.ts              # Core domain models
├── .env.example              # Environment variables template
└── README.md
```

---

## 📄 License
This project is open source and available under the [MIT License](LICENSE).
