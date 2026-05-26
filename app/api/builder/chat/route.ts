import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deductCredits } from "@/lib/credits";
import type { CreditAction } from "@/lib/stripe";
import { BuilderChatRequestSchema } from "@/lib/validation";
import { rateLimit, getRateLimitKey, getTimeUntilReset } from "@/lib/ratelimit";

const MODEL_MAP = {
  lite:     { model: "claude-haiku-4-5",  action: "message_lite"     as CreditAction },
  standard: { model: "claude-sonnet-4-6", action: "message_standard" as CreditAction },
  opus:     { model: "claude-opus-4-7",   action: "message_opus"     as CreditAction },
};

export async function POST(req: NextRequest) {
  try {
    // Validate request
    const body = await req.json();
    const validation = BuilderChatRequestSchema.safeParse(body);
    if (!validation.success) {
      console.error("Builder chat validation failed:", validation.error);
      return NextResponse.json(
        { error: "Invalid request: " + validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { messages, model = "standard" } = validation.data;
    const tier = MODEL_MAP[model as keyof typeof MODEL_MAP] ?? MODEL_MAP.standard;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = user.id;
    const rateLimitKey = getRateLimitKey(userId, "chat");
    if (!rateLimit(rateLimitKey, 10, 60 * 1000)) {
      const resetIn = getTimeUntilReset(rateLimitKey);
      return NextResponse.json(
        { error: `Rate limited. Try again in ${Math.ceil(resetIn / 1000)}s` },
        { status: 429, headers: { "Retry-After": String(Math.ceil(resetIn / 1000)) } }
      );
    }

    const result = await deductCredits(userId, tier.action, `Masidy ${model} message`);
    if (!result.success) {
      return NextResponse.json(
        { error: "Insufficient credits", remaining: result.remaining },
        { status: 402 }
      );
    }

    const systemPrompt = `You are Masidy, an expert AI software engineer.
Always respond with valid JSON only. Do not include markdown, analysis, or extra text outside the JSON object.
When asked to build or modify code, return a complete project or feature in this shape:
{
  "explanation": "brief explanation",
  "files": [
    { "path": "relative/path.tsx", "content": "full file content", "language": "typescript" }
  ],
  "preview_url": null
}
If the user asks for a new application or startup landing page, include all required root files for a runnable Next.js app, such as package.json, tsconfig.json, next.config.mjs, app/layout.tsx, app/page.tsx, globals.css, and any other needed files.
Use TypeScript, Tailwind CSS, and modern React patterns.
For simple questions or clarifications only, return { "explanation": "your answer", "files": [] }.`;

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
        messages: messages.map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: err }, { status: response.status });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? data.completion ?? data.response?.content?.[0]?.text ?? "";

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return NextResponse.json(JSON.parse(jsonMatch[0]));
    } catch (parseError) {
      console.error("[/api/builder/chat] JSON parse failed:", parseError, "raw response:", text);
    }

    return NextResponse.json({ explanation: text, files: [] });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[/api/builder/chat] Error:", {
      timestamp: new Date().toISOString(),
      error: errorMsg,
      stack: err instanceof Error ? err.stack : undefined,
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
