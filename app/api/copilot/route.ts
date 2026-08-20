import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import type { CopilotRequestBody, GeminiAnalysisResult } from '@/lib/geminiTypes';
import { MOCK_RESPONSES, DEFAULT_MOCK } from '@/lib/geminiMocks';

// ── Server-Side In-Memory Cache ───────────────────────────────────────────
// Keyed by `${scenarioId}:${consignmentId}` for fast repeated views.
// Note: We ONLY cache successful live inferences (never cache errors or mocks)
// so that newly added API keys or resolved rate limits reflect immediately.

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

interface CacheEntry {
  result: GeminiAnalysisResult;
  storedAt: number;          // epoch ms
  source: string;            // which model
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

// ── Active Gemini Production Model ────────────────────────────────────────
const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const FALLBACK_MODEL = 'gemini-3.6-flash';

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

// ── Single Gemini call with specified model ───────────────────────────────
async function callGeminiModel(
  ai: GoogleGenAI,
  modelName: string,
  body: CopilotRequestBody
): Promise<{ result: GeminiAnalysisResult; latencyMs: number; modelUsed: string }> {
  const start = Date.now();

  const response = await ai.models.generateContent({
    model: modelName,
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
  if (!rawText) throw new Error('Gemini returned empty response text');

  const parsed: GeminiAnalysisResult = JSON.parse(rawText);

  // Clamp breach probability
  parsed.risk_assessment.breach_probability = Math.max(
    0, Math.min(1, parsed.risk_assessment.breach_probability)
  );

  // Enforce exactly 2 mitigation options
  if (!Array.isArray(parsed.mitigation_options) || parsed.mitigation_options.length < 2) {
    throw new Error('Gemini returned fewer than 2 mitigation options');
  }

  return { result: parsed, latencyMs: Date.now() - start, modelUsed: modelName };
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

  // ── 1. Cache HIT (Only hits if previously succeeded with Live Gemini) ──────
  const cached = getCached(key);
  if (cached) {
    console.info(`[FleetPulse] Cache HIT for ${key} (model: ${cached.source})`);
    return NextResponse.json(
      { ...cached.result, isLiveInference: true, cached: true },
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

  // ── 2. Check API key presence ─────────────────────────────────────────────
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  const isMissingKey =
    !apiKey ||
    apiKey === 'your-gemini-api-key-here' ||
    apiKey === 'your_gemini_api_key_here';

  if (isMissingKey) {
    console.info('[FleetPulse] GEMINI_API_KEY environment variable is not configured.');
    const mock = getMockResponse(body);
    return NextResponse.json(
      { ...mock, isLiveInference: false, cached: false },
      {
        status: 200,
        headers: {
          'X-FleetPulse-Source': 'mock',
          'X-FleetPulse-Error': 'api-key-missing',
          'X-FleetPulse-Message': encodeURIComponent('GEMINI_API_KEY environment variable is missing or empty in Vercel settings.'),
          'X-Cache': 'MISS',
        },
      }
    );
  }

  // ── 3. Live Gemini Call with Multi-Model & Retry Resilience ───────────────
  const ai = new GoogleGenAI({ apiKey });

  let lastError: string = '';
  let isRateLimit = false;

  // Try Primary Model first (e.g. gemini-2.0-flash)
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const { result, latencyMs, modelUsed } = await callGeminiModel(ai, PRIMARY_MODEL, body);
      setCached(key, result, modelUsed);

      console.info(`[FleetPulse] Live Gemini success with ${modelUsed} in ${latencyMs}ms`);

      return NextResponse.json(
        { ...result, isLiveInference: true, cached: false },
        {
          status: 200,
          headers: {
            'X-FleetPulse-Source': modelUsed,
            'X-Cache': 'MISS',
            'X-Inference-Latency-Ms': String(latencyMs),
          },
        }
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      lastError = msg;
      isRateLimit = msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate');

      console.warn(`[FleetPulse] Primary model (${PRIMARY_MODEL}) attempt ${attempt} failed: ${msg}`);

      if (isRateLimit && attempt === 1) {
        // Wait 1.5s backoff before retrying attempt 2
        await sleep(1500);
        continue;
      }
      break; // Exit to fallback model
    }
  }

  // If primary model failed due to 404 or other non-quota issues, try secondary fallback model
  if (PRIMARY_MODEL !== FALLBACK_MODEL) {
    try {
      console.info(`[FleetPulse] Attempting secondary fallback model: ${FALLBACK_MODEL}`);
      const { result, latencyMs, modelUsed } = await callGeminiModel(ai, FALLBACK_MODEL, body);
      setCached(key, result, modelUsed);

      return NextResponse.json(
        { ...result, isLiveInference: true, cached: false },
        {
          status: 200,
          headers: {
            'X-FleetPulse-Source': modelUsed,
            'X-Cache': 'MISS',
            'X-Inference-Latency-Ms': String(latencyMs),
          },
        }
      );
    } catch (fallbackErr: unknown) {
      const msg = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
      lastError = `${lastError} | Fallback: ${msg}`;
      console.warn(`[FleetPulse] Fallback model (${FALLBACK_MODEL}) also failed: ${msg}`);
    }
  }

  // ── 4. Graceful Degradation to Mock (Never cached) ────────────────────────
  console.warn(`[FleetPulse] All live Gemini attempts failed. Serving mock fallback. Error: ${lastError}`);
  const mock = getMockResponse(body);

  return NextResponse.json(
    { ...mock, isLiveInference: false, cached: false },
    {
      status: 200,
      headers: {
        'X-FleetPulse-Source': 'mock-fallback',
        'X-FleetPulse-Error': isRateLimit ? 'rate-limited' : 'api-error',
        'X-FleetPulse-Message': encodeURIComponent(lastError.slice(0, 200)),
        'X-Cache': 'MISS',
      },
    }
  );
}

