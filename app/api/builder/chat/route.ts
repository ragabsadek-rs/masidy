import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deductCredits } from "@/lib/credits";
import { rateLimit } from "@/lib/ratelimit";
import { BuilderChatRequestSchema, parseBody } from "@/lib/validation";
import type { CreditAction } from "@/lib/stripe";
import { AGENT_TOOLS, AGENT_INFO, type AgentTier } from "@/lib/agent-tools";
import {
  executeWebSearch,
  executeCreateSupabaseTable,
  executeRunSQL,
  executeCreateStripeProduct,
  executeSendSlackMessage,
  executeCreateGitHubRepo,
  executePushToGitHub,
  executeCreateSentryProject,
  executeCreateDatadogMonitor,
  executeCreateCloudflareWorker,
  executeCreateLinearIssue,
  executeCreateNotionPage,
  executeSetupPostHog,
  executeCreateNetlifySite,
} from "@/lib/mcp-executors";

const MODEL_MAP: Record<string, { model: string; action: CreditAction }> = {
  lite:     { model: "claude-haiku-4-5",  action: "message_lite"     },
  standard: { model: "claude-sonnet-4-5", action: "message_standard" },
  opus:     { model: "claude-opus-4-5",   action: "message_opus"     },
};

// ── System prompts per tier ───────────────────────────────────────────────

function getSystemPrompt(tier: AgentTier): string {
  const info = AGENT_INFO[tier];

  const base = `You are ${info.name} — ${info.description}

You have tools to write files, read files, install dependencies, search the web, and deploy to Vercel.
${tier !== "lite" ? "You also have tools to create Supabase tables, Stripe products, send Slack messages, and push to GitHub." : ""}
${tier === "opus" ? "You also have tools for Sentry, Datadog, Cloudflare Workers, Linear, Notion, PostHog, and Netlify." : ""}

WORKFLOW:
1. Use write_file to create ALL necessary files
2. Use install_dependency for any packages needed
3. ${tier === "opus" ? "Use infrastructure tools (Supabase, Stripe, GitHub, Sentry, etc.) as needed" : tier === "standard" ? "Use Supabase/Stripe/GitHub tools when the app needs them" : "Focus on writing clean, complete code"}
4. Call done when finished

RULES:
- ALWAYS write actual code. Never say "you can add X" — add it yourself now.
- Write COMPLETE file content — no truncation, no "// rest of code here"
- Use Next.js 14 App Router + TypeScript + Tailwind CSS
- Every app needs: app/page.tsx, app/layout.tsx, app/globals.css, package.json
- Make UIs beautiful with proper Tailwind styling
- Add error handling, loading states, and responsive design`;

  if (tier === "opus") {
    return base + `

MASIDY MAX — AUTONOMOUS AGENT RULES:
- You are fully autonomous. Build the COMPLETE production application.
- Create 10-25 files covering the full feature set
- For SaaS: auth pages, dashboard, settings, billing, API routes, DB schema
- For e-commerce: product pages, cart, checkout, order management
- Use Supabase for database, Stripe for payments, GitHub for version control
- Set up Sentry for error tracking, create Linear issues for the roadmap
- Write Notion documentation for the project
- After building, push to GitHub and deploy to Vercel
- Think step by step about what a complete production app needs, then build ALL of it`;
  }

  if (tier === "standard") {
    return base + `

MASIDY STANDARD RULES:
- Build complete, working applications with all necessary files
- Include proper component structure and reusable components
- Add API routes when the app needs backend functionality
- Use Supabase for database when needed
- Set up Stripe for payments when needed
- Push to GitHub after building`;
  }

  return base + `

MASIDY LITE RULES:
- Build fast, focused implementations
- Create the core files needed for the request
- Keep it clean and functional`;
}

// ── Tool execution ────────────────────────────────────────────────────────

interface ProjectFile { path: string; content: string; language: string; }

async function executeToolCall(
  toolName: string,
  toolInput: Record<string, unknown>,
  projectFiles: Map<string, ProjectFile>
): Promise<{ result: string; shouldDeploy?: boolean; isDone?: boolean; summary?: string; autoDeploy?: boolean }> {

  // ── File tools ──────────────────────────────────────────────────────────
  if (toolName === "write_file") {
    const { path, content, language } = toolInput as { path: string; content: string; language: string };
    projectFiles.set(path, { path, content, language });
    return { result: `✓ Written: ${path} (${content.length} chars)` };
  }

  if (toolName === "read_file") {
    const { path } = toolInput as { path: string };
    const file = projectFiles.get(path);
    if (!file) return { result: `File not found: ${path}. Available: ${Array.from(projectFiles.keys()).join(", ")}` };
    return { result: file.content };
  }

  if (toolName === "list_files") {
    const files = Array.from(projectFiles.keys());
    return { result: files.length === 0 ? "No files yet" : files.join("\n") };
  }

  if (toolName === "install_dependency") {
    const { package: pkg, version, dev } = toolInput as { package: string; version: string; dev?: boolean };
    const pkgJson = projectFiles.get("package.json");
    if (pkgJson) {
      try {
        const parsed = JSON.parse(pkgJson.content);
        const target = dev ? "devDependencies" : "dependencies";
        if (!parsed[target]) parsed[target] = {};
        parsed[target][pkg] = version === "latest" ? "^1.0.0" : version;
        projectFiles.set("package.json", { path: "package.json", content: JSON.stringify(parsed, null, 2), language: "json" });
        return { result: `✓ Added ${pkg}@${version} to ${dev ? "devDependencies" : "dependencies"}` };
      } catch {
        return { result: `✓ Noted: ${pkg}@${version} will be installed` };
      }
    }
    return { result: `✓ Noted: ${pkg}@${version} will be installed` };
  }

  if (toolName === "deploy") {
    const { message } = toolInput as { message: string };
    return { result: `Deployment triggered: ${message}`, shouldDeploy: true };
  }

  if (toolName === "done") {
    const { summary, auto_deploy } = toolInput as { summary: string; auto_deploy?: boolean };
    return { result: "Done", isDone: true, summary, autoDeploy: auto_deploy ?? true };
  }

  // ── Web search ──────────────────────────────────────────────────────────
  if (toolName === "web_search") {
    const { query } = toolInput as { query: string };
    const r = await executeWebSearch(query);
    return { result: r.result };
  }

  // ── Supabase ────────────────────────────────────────────────────────────
  if (toolName === "create_supabase_table") {
    const { sql, description } = toolInput as { sql: string; description: string };
    const r = await executeCreateSupabaseTable(sql, description);
    return { result: r.result };
  }

  if (toolName === "run_sql") {
    const { sql } = toolInput as { sql: string };
    const r = await executeRunSQL(sql);
    return { result: r.result };
  }

  // ── Stripe ──────────────────────────────────────────────────────────────
  if (toolName === "create_stripe_product") {
    const r = await executeCreateStripeProduct(toolInput as Parameters<typeof executeCreateStripeProduct>[0]);
    return { result: r.result };
  }

  // ── Slack ───────────────────────────────────────────────────────────────
  if (toolName === "send_slack_message") {
    const { message, channel } = toolInput as { message: string; channel?: string };
    const r = await executeSendSlackMessage(message, channel);
    return { result: r.result };
  }

  // ── GitHub ──────────────────────────────────────────────────────────────
  if (toolName === "create_github_repo") {
    const r = await executeCreateGitHubRepo(toolInput as Parameters<typeof executeCreateGitHubRepo>[0]);
    return { result: r.result };
  }

  if (toolName === "push_to_github") {
    const { repo, message, branch } = toolInput as { repo: string; message: string; branch?: string };
    const files = Array.from(projectFiles.values()).map(f => ({ path: f.path, content: f.content }));
    const r = await executePushToGitHub({ repo, message, branch, files });
    return { result: r.result };
  }

  // ── Sentry ──────────────────────────────────────────────────────────────
  if (toolName === "create_sentry_project") {
    const { name, platform } = toolInput as { name: string; platform: string };
    const r = await executeCreateSentryProject(name, platform);
    return { result: r.result };
  }

  // ── Datadog ─────────────────────────────────────────────────────────────
  if (toolName === "create_datadog_monitor") {
    const r = await executeCreateDatadogMonitor(toolInput as Parameters<typeof executeCreateDatadogMonitor>[0]);
    return { result: r.result };
  }

  // ── Cloudflare ──────────────────────────────────────────────────────────
  if (toolName === "create_cloudflare_worker") {
    const { name, script } = toolInput as { name: string; script: string };
    const r = await executeCreateCloudflareWorker(name, script);
    return { result: r.result };
  }

  // ── Linear ──────────────────────────────────────────────────────────────
  if (toolName === "create_linear_issue") {
    const r = await executeCreateLinearIssue(toolInput as Parameters<typeof executeCreateLinearIssue>[0]);
    return { result: r.result };
  }

  // ── Notion ──────────────────────────────────────────────────────────────
  if (toolName === "create_notion_page") {
    const { title, content } = toolInput as { title: string; content: string };
    const r = await executeCreateNotionPage(title, content);
    return { result: r.result };
  }

  // ── PostHog ─────────────────────────────────────────────────────────────
  if (toolName === "setup_posthog") {
    const { project_name } = toolInput as { project_name: string };
    const r = await executeSetupPostHog(project_name);
    return { result: r.result };
  }

  // ── Netlify ─────────────────────────────────────────────────────────────
  if (toolName === "create_netlify_site") {
    const { name } = toolInput as { name: string };
    const r = await executeCreateNetlifySite(name);
    return { result: r.result };
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
    const tier = (model as AgentTier) ?? "lite";
    const agentInfo = AGENT_INFO[tier] ?? AGENT_INFO.lite;
    const modelConfig = MODEL_MAP[tier] ?? MODEL_MAP.lite;
    const tools = AGENT_TOOLS[tier] ?? AGENT_TOOLS.lite;
    const systemPrompt = getSystemPrompt(tier);
    const maxTokens = tier === "opus" ? 32000 : tier === "standard" ? 16000 : 8192;
    const maxIterations = agentInfo.maxIterations;

    // ── Persist user message ─────────────────────────────────────────────
    if (userId && data.projectId) {
      const { insertUserMessage } = await import("@/lib/messages");
      void insertUserMessage(userId, data.projectId, messages[messages.length - 1]?.content ?? "");
    }

    // ── Deduct credits ───────────────────────────────────────────────────
    if (userId) {
      const result = await deductCredits(userId, modelConfig.action, `${agentInfo.name} message`);
      if (!result.success) {
        return NextResponse.json({ error: "Insufficient credits", remaining: result.remaining }, { status: 402 });
      }
    }

    // ── Pre-populate project files ────────────────────────────────────────
    const projectFiles = new Map<string, ProjectFile>();
    if (data.existingFiles && Array.isArray(data.existingFiles)) {
      for (const f of data.existingFiles as ProjectFile[]) {
        projectFiles.set(f.path, f);
      }
    }

    // ── Agentic loop ──────────────────────────────────────────────────────
    let agentMessages = messages.map((m) => ({ role: m.role, content: m.content }));
    let explanation = "";
    let shouldDeploy = false;
    let isDone = false;
    let iterations = 0;
    const toolExecutionLog: string[] = [];

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
          model: modelConfig.model,
          max_tokens: maxTokens,
          system: systemPrompt,
          tools,
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

      // Collect text
      for (const block of content) {
        if (block.type === "text" && block.text) {
          explanation = block.text;
        }
      }

      // No tool use — done
      if (stopReason === "end_turn" || !content.some((b: { type: string }) => b.type === "tool_use")) {
        isDone = true;
        break;
      }

      // Execute tool calls
      const toolResults: { type: string; tool_use_id: string; content: string }[] = [];

      for (const block of content) {
        if (block.type !== "tool_use") continue;

        toolExecutionLog.push(`[${block.name}] ${JSON.stringify(block.input).slice(0, 100)}`);
        const toolResult = await executeToolCall(block.name, block.input, projectFiles);

        if (toolResult.shouldDeploy) shouldDeploy = true;
        if (toolResult.isDone) {
          isDone = true;
          if (toolResult.summary) explanation = toolResult.summary;
          if (toolResult.autoDeploy !== undefined) shouldDeploy = toolResult.autoDeploy;
        }

        toolResults.push({ type: "tool_result", tool_use_id: block.id, content: toolResult.result });
      }

      agentMessages = [
        ...agentMessages,
        { role: "assistant", content },
        { role: "user", content: toolResults },
      ];

      if (isDone) break;
    }

    // ── Collect files ─────────────────────────────────────────────────────
    const files = Array.from(projectFiles.values());

    if (!explanation && files.length > 0) {
      explanation = `Built ${files.length} file${files.length !== 1 ? "s" : ""}: ${files.map(f => f.path).slice(0, 3).join(", ")}${files.length > 3 ? `… and ${files.length - 3} more` : ""}`;
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
      tool_log: toolExecutionLog,
      agent: agentInfo.name,
    });

  } catch (err) {
    console.error("Builder chat error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
