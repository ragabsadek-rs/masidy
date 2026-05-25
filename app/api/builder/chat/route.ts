import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deductCredits } from "@/lib/credits";
import type { CreditAction } from "@/lib/stripe";

const MODEL_MAP = {
  lite:     { model: "claude-haiku-4-5",  action: "message_lite"     as CreditAction },
  standard: { model: "claude-sonnet-4-5", action: "message_standard" as CreditAction },
  opus:     { model: "claude-opus-4-5",   action: "message_opus"     as CreditAction },
};

export async function POST(req: NextRequest) {
  try {
    const { messages, model = "standard" } = await req.json();
    const tier = MODEL_MAP[model as keyof typeof MODEL_MAP] ?? MODEL_MAP.standard;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 });

    // Auth check + credit deduction (skip if no Supabase configured)
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const result = await deductCredits(user.id, tier.action, `Masidy ${model} message`);
        if (!result.success) {
          return NextResponse.json(
            { error: "Insufficient credits", remaining: result.remaining },
            { status: 402 }
          );
        }
      }
    }

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
    const text = data.content?.[0]?.text ?? "";

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
