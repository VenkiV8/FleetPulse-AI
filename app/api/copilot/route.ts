import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import type { CopilotRequestBody, GeminiAnalysisResult } from '@/lib/geminiTypes';
import { MOCK_RESPONSES, DEFAULT_MOCK } from '@/lib/geminiMocks';

// ── Server-Side In-Memory Cache ───────────────────────────────────────────
// Keyed by `${scenarioId}:${consignmentId}` for precise per-scenario caching.
// Lives for the lifetime of the Node.js process (cleared on cold start).

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

interface CacheEntry {
  result: GeminiAnalysisResult;
  storedAt: number;          // epoch ms
  source: string;            // which model or fallback
}

// Module-level Map — persists across requests within the same server instance
const responseCache = new Map<string, CacheEntry>();

function cacheKey(body: CopilotRequestBody): string {
  return `${body.scenarioId}:${body.consignmentId}`;
}

function getCached(key: string): CacheEntry | null {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.storedAt > CACHE_TTL_MS) {
    responseCache.delete(key);   // evict expired entry
    return null;
  }
  return entry;
}

function setCached(key: string, result: GeminiAnalysisResult, source: string): void {
  responseCache.set(key, { result, storedAt: Date.now(), source });
}

// ── JSON Schema for Gemini response (used with responseMimeType) ──────────
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

// ── Model name — high-RPM flash tier, NOT pro ─────────────────────────────
const GEMINI_MODEL = 'gemini-2.0-flash';

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

// ── Get mock for scenario ─────────────────────────────────────────────────
function getMockResponse(body: CopilotRequestBody): GeminiAnalysisResult {
  const scenarioMock = MOCK_RESPONSES[body.scenarioId];
  if (scenarioMock && body.status === 'CRITICAL') return scenarioMock;
  return DEFAULT_MOCK;
}

// ── Single Gemini call with optional 429 retry ────────────────────────────
async function callGemini(
  ai: GoogleGenAI,
  body: CopilotRequestBody,
  attempt: number = 1
): Promise<{ result: GeminiAnalysisResult; latencyMs: number }> {
  const start = Date.now();

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: buildUserPrompt(body),
    config: {
      systemInstruction: buildSystemPrompt(),
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.2,
      maxOutputTokens: 2500,
    },
  });

  const rawText = response.text;
  if (!rawText) throw new Error('Gemini returned empty response');

  const parsed: GeminiAnalysisResult = JSON.parse(rawText);

  // Clamp breach probability
  parsed.risk_assessment.breach_probability = Math.max(
    0, Math.min(1, parsed.risk_assessment.breach_probability)
  );

  // Enforce exactly 2 mitigation options
  if (!Array.isArray(parsed.mitigation_options) || parsed.mitigation_options.length < 2) {
    throw new Error('Gemini returned fewer than 2 mitigation options');
  }

  return { result: parsed, latencyMs: Date.now() - start };
}

// ── Sleep helper ──────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Route config ──────────────────────────────────────────────────────────
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// ── Main POST handler ─────────────────────────────────────────────────────
export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: CopilotRequestBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const key = cacheKey(body);

  // ── 1. Cache HIT ─────────────────────────────────────────────────────────
  const cached = getCached(key);
  if (cached) {
    console.info(`[FleetPulse] Cache HIT for ${key} (source: ${cached.source})`);
    return NextResponse.json(
      { ...cached.result, isLiveInference: cached.source.startsWith('gemini'), cached: true },
      {
        status: 200,
        headers: {
          'X-FleetPulse-Source': cached.source,
          'X-Cache': 'HIT',
          'X-Cache-Age': String(Math.round((Date.now() - cached.storedAt) / 1000)) + 's',
        },
      }
    );
  }

  // ── 2. No API key → immediate mock ───────────────────────────────────────
  const apiKey = process.env.GEMINI_API_KEY;
  const isMissingKey =
    !apiKey ||
    apiKey.trim() === '' ||
    apiKey === 'your-gemini-api-key-here' ||
    apiKey === 'your_gemini_api_key_here';

  if (isMissingKey) {
    console.info('[FleetPulse] GEMINI_API_KEY not set — using pre-calculated mock');
    const mock = getMockResponse(body);
    setCached(key, mock, 'mock');
    return NextResponse.json(
      { ...mock, isLiveInference: false, cached: false },
      {
        status: 200,
        headers: {
          'X-FleetPulse-Source': 'mock',
          'X-FleetPulse-Reason': 'api-key-missing',
          'X-Cache': 'MISS',
        },
      }
    );
  }

  // ── 3. Live Gemini call (with one 429 retry) ──────────────────────────────
  const ai = new GoogleGenAI({ apiKey });

  const tryGemini = async (attempt: number) => {
    try {
      return await callGemini(ai, body, attempt);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const is429 = msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate');

      if (is429 && attempt === 1) {
        // Single retry after 1.5s back-off
        console.warn(`[FleetPulse] Gemini 429 on attempt 1 — waiting 1.5s then retrying`);
        await sleep(1500);
        return tryGemini(2);
      }

      // Re-throw for outer catch to handle as mock fallback
      throw Object.assign(err instanceof Error ? err : new Error(msg), { is429, attempt });
    }
  };

  try {
    const { result, latencyMs } = await tryGemini(1);
    setCached(key, result, GEMINI_MODEL);

    console.info(`[FleetPulse] Gemini success for ${key} in ${latencyMs}ms`);

    return NextResponse.json(
      { ...result, isLiveInference: true, cached: false },
      {
        status: 200,
        headers: {
          'X-FleetPulse-Source': GEMINI_MODEL,
          'X-Cache': 'MISS',
          'X-Inference-Latency-Ms': String(latencyMs),
        },
      }
    );

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const isRateLimit = message.includes('429') || message.toLowerCase().includes('quota') || message.toLowerCase().includes('rate');

    console.warn(`[FleetPulse] Gemini ${isRateLimit ? 'rate-limited (retry exhausted)' : 'error'}: ${message} — serving mock`);

    const mock = getMockResponse(body);
    // Cache mock too — prevents a flood of retries under sustained quota pressure
    setCached(key, mock, 'mock-fallback');

    return NextResponse.json(
      { ...mock, isLiveInference: false, cached: false },
      {
        status: 200,
        headers: {
          'X-FleetPulse-Source': 'mock-fallback',
          'X-FleetPulse-Error': isRateLimit ? 'rate-limited' : 'api-error',
          'X-FleetPulse-Message': encodeURIComponent(message.slice(0, 120)),
          'X-Cache': 'MISS',
        },
      }
    );
  }
}
