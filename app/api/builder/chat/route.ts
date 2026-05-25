import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deductCredits } from "@/lib/credits";
import { rateLimit } from "@/lib/ratelimit";
import { BuilderChatRequestSchema, parseBody } from "@/lib/validation";
import type { CreditAction } from "@/lib/stripe";

const MODEL_MAP = {
  lite:     { model: "claude-haiku-4-5",  action: "message_lite"     as CreditAction },
  standard: { model: "claude-sonnet-4-5", action: "message_standard" as CreditAction },
  opus:     { model: "claude-opus-4-5",   action: "message_opus"     as CreditAction },
};

export async function POST(req: NextRequest) {
  try {
    // ── Auth (required) ──────────────────────────────────────────────────
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });

    let userId: string | null = null;

    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }
      userId = user.id;
    }

    // ── Rate limiting ────────────────────────────────────────────────────
    const rateLimitKey = userId ?? req.headers.get("x-forwarded-for") ?? "anonymous";
    const { success: rateLimitOk, remaining } = rateLimit(`chat:${rateLimitKey}`, 30, 60_000);
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    // ── Input validation ─────────────────────────────────────────────────
    const body = await req.json().catch(() => null);
    const { data, error: validationError } = parseBody(BuilderChatRequestSchema, body);
    if (validationError || !data) {
      return NextResponse.json({ error: validationError ?? "Invalid request" }, { status: 400 });
    }

    const { messages, model } = data;
    const tier = MODEL_MAP[model] ?? MODEL_MAP.standard;

    // ── Credit deduction ─────────────────────────────────────────────────
    if (userId) {
      const result = await deductCredits(userId, tier.action, `Masidy ${model} message`);
      if (!result.success) {
        return NextResponse.json(
          { error: "Insufficient credits", remaining: result.remaining },
          { status: 402 }
        );
      }
    }

    // ── AI call ──────────────────────────────────────────────────────────
    const systemPrompt = `You are Masidy, an expert AI software engineer.
When asked to build or modify code, respond with JSON:
{
  "explanation": "brief explanation",
  "files": [
    { "path": "relative/path.tsx", "content": "full file content", "language": "typescript" }
  ],
  "preview_url": null
}
Use TypeScript, Tailwind CSS, and modern React patterns.
For questions only: { "explanation": "your answer", "files": [] }`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: tier.model,
        max_tokens: 8192,
        system: systemPrompt,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("AI API error:", response.status, err);
      return NextResponse.json({ error: "AI service error" }, { status: 502 });
    }

    const aiData = await response.json();
    const text = aiData.content?.[0]?.text ?? "";

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return NextResponse.json(JSON.parse(jsonMatch[0]));
    } catch {}

    return NextResponse.json({ explanation: text, files: [] });
  } catch (err) {
    console.error("Builder chat error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
