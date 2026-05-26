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

// Strict system prompt that forces JSON output every time
const SYSTEM_PROMPT = `You are Masidy, an AI software engineer inside a code editor.

CRITICAL RULE: You MUST ALWAYS respond with ONLY a valid JSON object. Never write prose, markdown, or code blocks outside of JSON. Your entire response must be parseable JSON.

Response format (ALWAYS use this exact structure):
{
  "explanation": "1-2 sentence summary of what you built or changed",
  "files": [
    {
      "path": "app/page.tsx",
      "content": "full file content here",
      "language": "typescript"
    }
  ]
}

Rules:
- ALWAYS include "files" array, even if empty
- For build requests: include ALL files needed (page.tsx, components, styles, etc.)
- File paths are relative (e.g. "app/page.tsx", "components/Button.tsx")
- Use Next.js 14 App Router, TypeScript, Tailwind CSS
- Write complete, working files — never truncate with "..." or "rest of code"
- For pure questions with no code needed: set "files" to []
- Do NOT wrap your response in markdown code blocks
- Do NOT add any text before or after the JSON object`;

function extractJSON(text: string): { explanation: string; files: { path: string; content: string; language: string }[] } | null {
  // Try 1: direct parse
  try { return JSON.parse(text.trim()); } catch {}

  // Try 2: extract from markdown code block ```json ... ```
  const codeBlock = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (codeBlock) {
    try { return JSON.parse(codeBlock[1]); } catch {}
  }

  // Try 3: find the outermost { } using bracket counting
  let depth = 0;
  let start = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (text[i] === "}") {
      depth--;
      if (depth === 0 && start !== -1) {
        try { return JSON.parse(text.slice(start, i + 1)); } catch {}
        start = -1;
      }
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });

    // ── Auth ─────────────────────────────────────────────────────────────
    let userId: string | null = null;
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      userId = user.id;
    }

    // ── Rate limit ───────────────────────────────────────────────────────
    const rateLimitKey = userId ?? req.headers.get("x-forwarded-for") ?? "anonymous";
    const { success: rateLimitOk } = rateLimit(`chat:${rateLimitKey}`, 30, 60_000);
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    // ── Validate ─────────────────────────────────────────────────────────
    const body = await req.json().catch(() => null);
    const { data, error: validationError } = parseBody(BuilderChatRequestSchema, body);
    if (validationError || !data) {
      return NextResponse.json({ error: validationError ?? "Invalid request" }, { status: 400 });
    }

    const { messages, model } = data;
    const tier = MODEL_MAP[model] ?? MODEL_MAP.lite;

    // ── Persist user message (fire-and-forget) ───────────────────────────
    if (userId && data.projectId) {
      const { insertUserMessage } = await import("@/lib/messages");
      void insertUserMessage(userId, data.projectId, messages[messages.length - 1]?.content ?? "");
    }

    // ── Deduct credits ───────────────────────────────────────────────────
    if (userId) {
      const result = await deductCredits(userId, tier.action, `Masidy ${model} message`);
      if (!result.success) {
        return NextResponse.json(
          { error: "Insufficient credits", remaining: result.remaining },
          { status: 402 }
        );
      }
    }

    // ── Call AI ──────────────────────────────────────────────────────────
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
        system: SYSTEM_PROMPT,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("AI API error:", response.status, err);
      return NextResponse.json({ error: "AI service error" }, { status: 502 });
    }

    const aiData = await response.json();
    const text = (aiData.content?.[0]?.text ?? "").trim();

    // Parse JSON from response
    const parsed = extractJSON(text);
    if (parsed) {
      // ── Persist assistant message (fire-and-forget) ──────────────────
      if (userId && data.projectId) {
        const { insertAssistantMessage } = await import("@/lib/messages");
        void insertAssistantMessage(
          userId,
          data.projectId,
          parsed.explanation ?? "Done.",
          Array.isArray(parsed.files) ? parsed.files : []
        );
      }
      return NextResponse.json({
        explanation: parsed.explanation ?? "Done.",
        files: Array.isArray(parsed.files) ? parsed.files : [],
      });
    }

    // Fallback: AI didn't return JSON — return as explanation with no files
    console.warn("AI returned non-JSON response:", text.slice(0, 200));
    return NextResponse.json({
      explanation: text.length > 500 ? text.slice(0, 500) + "…" : text,
      files: [],
    });

  } catch (err) {
    console.error("Builder chat error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
