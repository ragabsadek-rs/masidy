import { NextRequest, NextResponse } from "next/server";

// Agent IDs from your Claude Cloud setup
const AGENTS = {
  standard: "agent_01JW3Y9RxoFMasidyStandard", // claude-sonnet-4-6
  lite:     "agent_01FrpNZiTYN4RA2phxP8TuXY",  // claude-haiku-4-5  (fast)
  opus:     "agent_01JW3YkJumNvMasidyOpus",     // claude-opus-4-7   (powerful)
} as const;

export async function POST(req: NextRequest) {
  try {
    const { messages, model = "standard", files } = await req.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 });
    }

    // Build system prompt for code generation
    const systemPrompt = `You are Masidy, an expert AI software engineer. 
When asked to build or modify code:
1. Always respond with complete, working code files
2. Format your response as JSON with this structure:
{
  "explanation": "brief explanation of what you did",
  "files": [
    { "path": "relative/file/path.tsx", "content": "full file content", "language": "typescript" }
  ],
  "preview_url": null
}
3. For React/Next.js apps, generate complete components with proper imports
4. Use TypeScript, Tailwind CSS, and modern React patterns
5. If only answering a question (no code needed), respond with:
{
  "explanation": "your answer",
  "files": []
}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: model === "opus" ? "claude-opus-4-5" : model === "lite" ? "claude-haiku-4-5" : "claude-sonnet-4-5",
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

    // Try to parse structured JSON response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json(parsed);
      }
    } catch {
      // Not JSON — return as plain explanation
    }

    return NextResponse.json({ explanation: text, files: [] });
  } catch (err) {
    console.error("Builder chat error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
