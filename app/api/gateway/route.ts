import { NextRequest, NextResponse } from "next/server";
import { validateGatewayKey, recordGatewayUsage, type GatewayProvider } from "@/lib/gateway";
import { deductCredits } from "@/lib/credits";
import { rateLimit } from "@/lib/ratelimit";

const PROVIDER_ENDPOINTS: Record<GatewayProvider, string> = {
  anthropic: "https://api.anthropic.com/v1/messages",
  openai: "https://api.openai.com/v1/chat/completions",
  gemini: "https://generativelanguage.googleapis.com/v1beta/models",
};

const PROVIDER_ENV_KEYS: Record<GatewayProvider, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
  gemini: "GEMINI_API_KEY",
};

const MODEL_CREDIT_COST: Record<string, number> = {
  "claude-haiku": 0.5,
  "claude-sonnet": 2,
  "claude-opus": 5,
  "gpt-3.5-turbo": 0.5,
  "gpt-4": 3,
  "gpt-4o": 2,
  "gemini-pro": 1,
  "gemini-1.5-pro": 2,
};

function getCreditCost(model: string): number {
  for (const [key, cost] of Object.entries(MODEL_CREDIT_COST)) {
    if (model.toLowerCase().includes(key)) return cost;
  }
  return 1; // default
}

export async function POST(req: NextRequest) {
  // Extract Bearer key
  const authHeader = req.headers.get("authorization") ?? "";
  const plaintext = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!plaintext) {
    await recordGatewayUsage({ keyId: "unknown", userId: "unknown", provider: "anthropic", model: "unknown", creditsUsed: 0, status: "auth_error" });
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  // Validate key
  const keyRecord = await validateGatewayKey(plaintext);
  if (!keyRecord) {
    await recordGatewayUsage({ keyId: "unknown", userId: "unknown", provider: "anthropic", model: "unknown", creditsUsed: 0, status: "auth_error" });
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  // Rate limit: 60 req/min per key
  const { success: rateLimitOk } = rateLimit(`gateway:${keyRecord.id}`, 60, 60_000);
  if (!rateLimitOk) {
    await recordGatewayUsage({ keyId: keyRecord.id, userId: keyRecord.user_id, provider: "anthropic", model: "unknown", creditsUsed: 0, status: "rate_limited" });
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: { "Retry-After": "60" } });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const { provider, model, messages } = body as { provider?: string; model?: string; messages?: unknown[] };

  if (!provider || !["anthropic", "openai", "gemini"].includes(provider)) {
    return NextResponse.json({ error: "Invalid provider. Must be anthropic, openai, or gemini" }, { status: 400 });
  }
  if (!model) return NextResponse.json({ error: "model is required" }, { status: 400 });

  const gProvider = provider as GatewayProvider;
  const creditsNeeded = getCreditCost(model);

  // Deduct credits
  const creditResult = await deductCredits(keyRecord.user_id, "message_lite", `Gateway: ${provider}/${model}`);
  if (!creditResult.success) {
    await recordGatewayUsage({ keyId: keyRecord.id, userId: keyRecord.user_id, provider: gProvider, model, creditsUsed: 0, status: "credit_error" });
    return NextResponse.json({ error: "Insufficient credits", remaining: creditResult.remaining }, { status: 402 });
  }

  // Check provider API key
  const providerKey = process.env[PROVIDER_ENV_KEYS[gProvider]];
  if (!providerKey) {
    await recordGatewayUsage({ keyId: keyRecord.id, userId: keyRecord.user_id, provider: gProvider, model, creditsUsed: creditsNeeded, status: "provider_error" });
    return NextResponse.json({ error: `Provider ${provider} is not configured` }, { status: 503 });
  }

  // Forward to provider
  try {
    const endpoint = gProvider === "gemini"
      ? `${PROVIDER_ENDPOINTS.gemini}/${model}:generateContent?key=${providerKey}`
      : PROVIDER_ENDPOINTS[gProvider];

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (gProvider === "anthropic") {
      headers["x-api-key"] = providerKey;
      headers["anthropic-version"] = "2023-06-01";
    } else if (gProvider === "openai") {
      headers["Authorization"] = `Bearer ${providerKey}`;
    }

    const providerRes = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(gProvider === "gemini"
        ? { contents: messages }
        : { model, messages }
      ),
    });

    if (!providerRes.ok) {
      await recordGatewayUsage({ keyId: keyRecord.id, userId: keyRecord.user_id, provider: gProvider, model, creditsUsed: creditsNeeded, status: "provider_error" });
      return NextResponse.json({ error: "Provider error", provider, status: providerRes.status }, { status: 502 });
    }

    const data = await providerRes.json();
    await recordGatewayUsage({ keyId: keyRecord.id, userId: keyRecord.user_id, provider: gProvider, model, creditsUsed: creditsNeeded, status: "success" });
    return NextResponse.json(data);

  } catch {
    await recordGatewayUsage({ keyId: keyRecord.id, userId: keyRecord.user_id, provider: gProvider, model, creditsUsed: creditsNeeded, status: "provider_error" });
    return NextResponse.json({ error: "Provider error", provider }, { status: 502 });
  }
}
