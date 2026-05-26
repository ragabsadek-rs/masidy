import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deductCredits } from "@/lib/credits";
import { rateLimit } from "@/lib/ratelimit";
import { BuilderChatRequestSchema, parseBody } from "@/lib/validation";
import type { CreditAction } from "@/lib/stripe";

const MODEL_MAP = {
  lite:     { model: "claude-haiku-4-5",  action: "message_lite"     as CreditAction, maxTokens: 8192,  maxIter: 3  },
  standard: { model: "claude-sonnet-4-5", action: "message_standard" as CreditAction, maxTokens: 16000, maxIter: 8  },
  opus:     { model: "claude-opus-4-5",   action: "message_opus"     as CreditAction, maxTokens: 32000, maxIter: 15 },
};

// ── Tools the AI can call ─────────────────────────────────────────────────

const TOOLS = [
  {
    name: "write_file",
    description: "Write or overwrite a file in the project. Use this to create any file: pages, components, API routes, configs, styles, etc.",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "File path relative to project root, e.g. 'app/page.tsx', 'components/Button.tsx', 'package.json'" },
        content: { type: "string", description: "Complete file content. Never truncate. Write the full file." },
        language: { type: "string", description: "File language: typescript, javascript, css, json, markdown, etc." },
      },
      required: ["path", "content", "language"],
    },
  },
  {
    name: "read_file",
    description: "Read an existing file from the project to understand current code before making changes.",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "File path to read" },
      },
      required: ["path"],
    },
  },
  {
    name: "list_files",
    description: "List all files currently in the project.",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "install_dependency",
    description: "Add a npm package to package.json dependencies. Use this when you need a library that isn't in the project yet.",
    input_schema: {
      type: "object",
      properties: {
        package: { type: "string", description: "Package name, e.g. 'zod', 'react-hook-form', 'framer-motion'" },
        version: { type: "string", description: "Version string, e.g. '^3.0.0'. Use 'latest' if unsure." },
        dev: { type: "boolean", description: "True if this is a devDependency" },
      },
      required: ["package", "version"],
    },
  },
  {
    name: "deploy",
    description: "Deploy the current project files to Vercel and get a live URL. Call this when the app is ready.",
    input_schema: {
      type: "object",
      properties: {
        message: { type: "string", description: "What was built/changed in this deployment" },
      },
      required: ["message"],
    },
  },
  {
    name: "done",
    description: "Signal that you have finished building. Provide a summary of what was built.",
    input_schema: {
      type: "object",
      properties: {
        summary: { type: "string", description: "What was built, what files were created, and what the app does" },
        auto_deploy: { type: "boolean", description: "Whether to automatically deploy after this message" },
      },
      required: ["summary"],
    },
  },
];

// ── System prompt ─────────────────────────────────────────────────────────

function getSystemPrompt(model: keyof typeof MODEL_MAP): string {
  const base = `You are Masidy — a fully autonomous AI software engineer inside a browser-based IDE.

You have tools to write files, read files, list files, install dependencies, and deploy to Vercel.

WORKFLOW:
1. Understand what the user wants to build
2. Use write_file to create ALL necessary files (pages, components, API routes, styles, configs)
3. Use install_dependency for any packages you need
4. When done, call the done tool with a summary

RULES:
- ALWAYS write actual code. Never say "you can add X" — add it yourself.
- Write COMPLETE file content every time — no truncation, no "// rest of code here"
- Use Next.js 14 App Router + TypeScript + Tailwind CSS
- Every app needs at minimum: app/page.tsx, app/layout.tsx, app/globals.css, package.json
- Make UIs beautiful with proper Tailwind styling
- Add error handling, loading states, and responsive design
- Never ask for clarification on simple requests — just build it`;

  if (model === "opus") {
    return base + `

MASIDY MAX RULES:
- You are fully autonomous. Build the COMPLETE application.
- For every request, create 5-20 files covering the full feature set
- Include: all pages, all components, API routes, lib utilities, types, styles
- For SaaS: include auth pages, dashboard, settings, billing UI
- For e-commerce: product pages, cart, checkout flow
- For APIs: route handlers, validation, error responses, documentation page
- Think step by step about what a complete app needs, then build ALL of it
- After writing all files, call deploy to get a live URL`;
  }

  if (model === "standard") {
    return base + `

MASIDY STANDARD RULES:
- Build complete, working applications with all necessary files
- Include proper component structure and reusable components
- Add API routes when the app needs backend functionality
- After writing all files, call done with auto_deploy: true`;
  }

  return base + `

MASIDY LITE RULES:
- Build fast, focused implementations
- Create the core files needed for the request
- Keep it clean and functional
- After writing files, call done with auto_deploy: true`;
}

// ── Tool execution ────────────────────────────────────────────────────────

interface ProjectFile { path: string; content: string; language: string; }

function executeToolCall(
  toolName: string,
  toolInput: Record<string, unknown>,
  projectFiles: Map<string, ProjectFile>
): { result: string; shouldDeploy?: boolean; deployMessage?: string; isDone?: boolean; summary?: string; autoDeploy?: boolean } {

  if (toolName === "write_file") {
    const { path, content, language } = toolInput as { path: string; content: string; language: string };
    projectFiles.set(path, { path, content, language });
    return { result: `✓ Written: ${path} (${content.length} chars)` };
  }

  if (toolName === "read_file") {
    const { path } = toolInput as { path: string };
    const file = projectFiles.get(path);
    if (!file) return { result: `File not found: ${path}` };
    return { result: file.content };
  }

  if (toolName === "list_files") {
    const files = Array.from(projectFiles.keys());
    if (files.length === 0) return { result: "No files yet" };
    return { result: files.join("\n") };
  }

  if (toolName === "install_dependency") {
    const { package: pkg, version, dev } = toolInput as { package: string; version: string; dev?: boolean };
    // Update package.json if it exists
    const pkgJson = projectFiles.get("package.json");
    if (pkgJson) {
      try {
        const parsed = JSON.parse(pkgJson.content);
        const target = dev ? "devDependencies" : "dependencies";
        if (!parsed[target]) parsed[target] = {};
        parsed[target][pkg] = version === "latest" ? "^1.0.0" : version;
        projectFiles.set("package.json", { path: "package.json", content: JSON.stringify(parsed, null, 2), language: "json" });
        return { result: `✓ Added ${pkg}@${version} to ${target}` };
      } catch {
        return { result: `✓ Noted: will add ${pkg}@${version} to package.json` };
      }
    }
    return { result: `✓ Noted: ${pkg}@${version} will be installed` };
  }

  if (toolName === "deploy") {
    const { message } = toolInput as { message: string };
    return { result: "Deployment triggered", shouldDeploy: true, deployMessage: message };
  }

  if (toolName === "done") {
    const { summary, auto_deploy } = toolInput as { summary: string; auto_deploy?: boolean };
    return { result: "Done", isDone: true, summary, autoDeploy: auto_deploy ?? true };
  }

  return { result: `Unknown tool: ${toolName}` };
}

// ── Main handler ──────────────────────────────────────────────────────────

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
      return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429, headers: { "Retry-After": "60" } });
    }

    // ── Validate ─────────────────────────────────────────────────────────
    const body = await req.json().catch(() => null);
    const { data, error: validationError } = parseBody(BuilderChatRequestSchema, body);
    if (validationError || !data) {
      return NextResponse.json({ error: validationError ?? "Invalid request" }, { status: 400 });
    }

    const { messages, model } = data;
    const tier = MODEL_MAP[model as keyof typeof MODEL_MAP] ?? MODEL_MAP.lite;
    const systemPrompt = getSystemPrompt(model as keyof typeof MODEL_MAP);

    // ── Persist user message ─────────────────────────────────────────────
    if (userId && data.projectId) {
      const { insertUserMessage } = await import("@/lib/messages");
      void insertUserMessage(userId, data.projectId, messages[messages.length - 1]?.content ?? "");
    }

    // ── Deduct credits ───────────────────────────────────────────────────
    if (userId) {
      const result = await deductCredits(userId, tier.action, `Masidy ${model} message`);
      if (!result.success) {
        return NextResponse.json({ error: "Insufficient credits", remaining: result.remaining }, { status: 402 });
      }
    }

    // ── Agentic loop with tool use ────────────────────────────────────────
    const projectFiles = new Map<string, ProjectFile>();

    // Pre-populate with existing files from the request if provided
    if (data.existingFiles && Array.isArray(data.existingFiles)) {
      for (const f of data.existingFiles as ProjectFile[]) {
        projectFiles.set(f.path, f);
      }
    }

    let agentMessages = messages.map((m) => ({ role: m.role, content: m.content }));
    let explanation = "";
    let shouldDeploy = false;
    let isDone = false;
    let iterations = 0;
    const maxIterations = tier.maxIter;

    while (!isDone && iterations < maxIterations) {
      iterations++;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: tier.model,
          max_tokens: tier.maxTokens,
          system: systemPrompt,
          tools: TOOLS,
          messages: agentMessages,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error("AI API error:", response.status, err);
        return NextResponse.json({ error: "AI service error. Please try again." }, { status: 502 });
      }

      const aiData = await response.json();
      const stopReason = aiData.stop_reason;
      const content = aiData.content ?? [];

      // Collect text explanations
      for (const block of content) {
        if (block.type === "text" && block.text) {
          explanation = block.text;
        }
      }

      // If no tool use, we're done
      if (stopReason === "end_turn" || !content.some((b: { type: string }) => b.type === "tool_use")) {
        isDone = true;
        break;
      }

      // Process tool calls
      const toolResults: { type: string; tool_use_id: string; content: string }[] = [];

      for (const block of content) {
        if (block.type !== "tool_use") continue;

        const toolResult = executeToolCall(block.name, block.input, projectFiles);

        if (toolResult.shouldDeploy) shouldDeploy = true;
        if (toolResult.isDone) {
          isDone = true;
          if (toolResult.summary) explanation = toolResult.summary;
          if (toolResult.autoDeploy !== undefined) shouldDeploy = toolResult.autoDeploy;
        }

        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: toolResult.result,
        });
      }

      // Add assistant message and tool results to conversation
      agentMessages = [
        ...agentMessages,
        { role: "assistant", content },
        { role: "user", content: toolResults },
      ];

      if (isDone) break;
    }

    // ── Collect all written files ─────────────────────────────────────────
    const files = Array.from(projectFiles.values());

    // If no explanation was set, generate one
    if (!explanation && files.length > 0) {
      explanation = `Built ${files.length} file${files.length !== 1 ? "s" : ""}: ${files.map(f => f.path).slice(0, 3).join(", ")}${files.length > 3 ? "…" : ""}`;
    }

    // ── Persist assistant message ─────────────────────────────────────────
    if (userId && data.projectId && files.length > 0) {
      const { insertAssistantMessage } = await import("@/lib/messages");
      void insertAssistantMessage(userId, data.projectId, explanation, files);
    }

    return NextResponse.json({
      explanation: explanation || "Done.",
      files,
      auto_deploy: shouldDeploy || files.length > 0,
    });

  } catch (err) {
    console.error("Builder chat error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
