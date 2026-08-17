import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import type { CopilotRequestBody, GeminiAnalysisResult } from '@/lib/geminiTypes';
import { MOCK_RESPONSES, DEFAULT_MOCK } from '@/lib/geminiMocks';

// ── JSON Schema for Gemini response (used with responseMimeType) ───────────
const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    risk_assessment: {
      type: 'object',
      properties: {
        breach_probability: { type: 'number' },
        severity: { type: 'string', enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] },
        time_to_breach_hours: { type: 'number' },
        financial_exposure_inr: { type: 'number' },
        summary: { type: 'string' },
      },
      required: ['breach_probability', 'severity', 'time_to_breach_hours', 'financial_exposure_inr', 'summary'],
    },
    mitigation_options: {
      type: 'array',
      minItems: 2,
      maxItems: 2,
      items: {
        type: 'object',
        properties: {
          rank: { type: 'number' },
          label: { type: 'string' },
          strategy: { type: 'string' },
          operational_cost_inr: { type: 'number' },
          delay_impact_minutes: { type: 'number' },
          net_savings_inr: { type: 'number' },
          feasibility: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW'] },
          action_steps: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 3 },
        },
        required: ['rank', 'label', 'strategy', 'operational_cost_inr', 'delay_impact_minutes', 'net_savings_inr', 'feasibility', 'action_steps'],
      },
    },
    driver_dispatch_memo: { type: 'string' },
    customer_status_advisory: { type: 'string' },
  },
  required: ['risk_assessment', 'mitigation_options', 'driver_dispatch_memo', 'customer_status_advisory'],
};

// ── System prompt ─────────────────────────────────────────────────────────
function buildSystemPrompt(): string {
  return `You are FleetPulse AI, an autonomous logistics intelligence engine specialising in Indian freight operations, SLA management, and real-time disruption response.

Your role: When given a disrupted consignment's metadata, calculate the SLA breach probability and formulate exactly TWO ranked mitigation strategies. Compare operational cost vs. penalty saved for each strategy.

Rules:
- All monetary values are in Indian Rupees (INR) as integers.
- breach_probability is a float between 0.0 and 1.0.
- Provide exactly 2 mitigation_options ranked 1 (primary) and 2 (alternative).
- Each strategy must have exactly 3 concrete, actionable steps with specific details (GPS coords, portal names, dock numbers, etc.).
- driver_dispatch_memo must be a professional, formal instruction to the driver including reference codes.
- customer_status_advisory must be ≤160 characters (SMS format) including the truck ID.
- Your analysis must reflect realistic Indian logistics context: NHAI corridors, IMD alerts, JNPT port protocols, SLA penalty clauses, fleet depot locations.
- Return ONLY valid JSON matching the provided schema. No markdown, no commentary.`;
}

// ── User prompt ───────────────────────────────────────────────────────────
function buildUserPrompt(body: CopilotRequestBody): string {
  return `Analyse this disrupted freight consignment and return the risk assessment and mitigation strategies:

CONSIGNMENT DETAILS:
- ID: ${body.consignmentId}
- Client: ${body.client}
- Route: ${body.route} (${body.origin} → ${body.destination})
- Cargo: ${body.cargo}
- Disruption Type: ${body.disruption}
- Current Status: ${body.status}
- Delay: ${body.delay ?? 'None recorded'}
- Incident Location: ${body.hazardLocation}

LIVE TELEMETRY:
- Speed: ${body.telemetry.speed} km/h
- Fuel: ${body.telemetry.fuel}%
- Distance Remaining: ${body.telemetry.distanceRemaining} km
- Current ETA: ${body.telemetry.eta}

Calculate:
1. SLA breach probability (0–1) and financial exposure in INR
2. Two ranked mitigation strategies with cost/savings trade-off
3. A formal driver dispatch memo
4. A customer advisory SMS (≤160 chars)`;
}

// ── Get mock for scenario (critical consignment only) ─────────────────────
function getMockResponse(body: CopilotRequestBody): GeminiAnalysisResult {
  // Use scenario-specific mock if this is a critical consignment
  const scenarioMock = MOCK_RESPONSES[body.scenarioId];
  if (scenarioMock && body.status === 'CRITICAL') {
    return scenarioMock;
  }
  // Otherwise return the generic "on-track" mock
  return DEFAULT_MOCK;
}

// ── Main POST handler ─────────────────────────────────────────────────────
export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: CopilotRequestBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // ── Fast fallback: no API key configured ─────────────────────────────────
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your-gemini-api-key-here') {
    console.info('[FleetPulse] GEMINI_API_KEY not set — using pre-calculated mock response');
    return NextResponse.json(getMockResponse(body), {
      status: 200,
      headers: { 'X-FleetPulse-Source': 'mock' },
    });
  }

  // ── Live Gemini call ──────────────────────────────────────────────────────
  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: buildUserPrompt(body),
      config: {
        systemInstruction: buildSystemPrompt(),
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.3,   // deterministic for logistics analysis
        maxOutputTokens: 4000,
      },
    });

    const rawText = response.text;

    if (!rawText) {
      throw new Error('Gemini returned empty response');
    }

    // Parse and validate the JSON
    const parsed: GeminiAnalysisResult = JSON.parse(rawText);

    // Clamp breach_probability to valid range
    parsed.risk_assessment.breach_probability = Math.max(
      0,
      Math.min(1, parsed.risk_assessment.breach_probability)
    );

    // Enforce exactly 2 mitigation options
    if (!Array.isArray(parsed.mitigation_options) || parsed.mitigation_options.length < 2) {
      throw new Error('Gemini returned fewer than 2 mitigation options');
    }

    return NextResponse.json(parsed, {
      status: 200,
      headers: { 'X-FleetPulse-Source': 'gemini-3.6-flash' },
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const isRateLimit = message.includes('429') || message.toLowerCase().includes('quota') || message.toLowerCase().includes('rate');

    console.warn(
      `[FleetPulse] Gemini API ${isRateLimit ? 'rate-limited' : 'error'}: ${message} — falling back to mock`
    );

    // Graceful degradation: return mock so the UI always renders
    return NextResponse.json(getMockResponse(body), {
      status: 200,
      headers: {
        'X-FleetPulse-Source': 'mock-fallback',
        'X-FleetPulse-Error': isRateLimit ? 'rate-limited' : 'api-error',
      },
    });
  }
}
