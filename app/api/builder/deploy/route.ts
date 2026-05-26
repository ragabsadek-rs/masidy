import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BuilderDeployRequestSchema } from "@/lib/validation";
import { rateLimit, getRateLimitKey, getTimeUntilReset } from "@/lib/ratelimit";

const TOKEN = process.env.VERCEL_ACCESS_TOKEN!;
const TEAM  = process.env.VERCEL_TEAM_ID!;

export async function POST(req: NextRequest) {
  try {
    // Validate request
    const body = await req.json();
    const validation = BuilderDeployRequestSchema.safeParse(body);
    if (!validation.success) {
      console.error("[/api/builder/deploy] Validation failed:", validation.error);
      return NextResponse.json(
        { error: "Invalid request: " + validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { files, projectName } = validation.data;

    // Rate limiting + auth
    let userId = "anonymous";
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        userId = user.id;
      }

      // Rate limit check (5 deployments per minute per user)
      const rateLimitKey = getRateLimitKey(userId, "deploy");
      if (!rateLimit(rateLimitKey, 5, 60 * 1000)) {
        const resetIn = getTimeUntilReset(rateLimitKey);
        console.warn(`[/api/builder/deploy] Rate limit exceeded for user ${userId}`);
        return NextResponse.json(
          { error: `Rate limited. Try again in ${Math.ceil(resetIn / 1000)}s` },
          { status: 429, headers: { "Retry-After": String(Math.ceil(resetIn / 1000)) } }
        );
      }
    }

    const name = (projectName ?? `masidy-${Date.now()}`).toLowerCase().replace(/[^a-z0-9-]/g, "-");

    // Build Vercel deployment files payload
    const deployFiles = files.map((f) => ({
      file: f.path,
      data: Buffer.from(f.content).toString("base64"),
      encoding: "base64",
    }));

    // Add a minimal package.json if not present
    if (!files.find(f => f.path === "package.json")) {
      deployFiles.push({
        file: "package.json",
        data: Buffer.from(JSON.stringify({
          name, version: "0.1.0", private: true,
          scripts: { dev: "next dev", build: "next build", start: "next start" },
          dependencies: { next: "^14", react: "^18", "react-dom": "^18" },
        }, null, 2)).toString("base64"),
        encoding: "base64",
      });
    }

    const res = await fetch(`https://api.vercel.com/v13/deployments?teamId=${TEAM}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        files: deployFiles,
        projectSettings: { framework: "nextjs", buildCommand: "next build", outputDirectory: ".next" },
        target: "preview",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.error?.message ?? "Deploy failed" }, { status: res.status });
    }

    // Poll for ready state (max 60s)
    const deployId = data.id;
    let url = data.url;
    let state = data.readyState ?? data.status;

    for (let i = 0; i < 30; i++) {
      if (state === "READY" || state === "ERROR" || state === "CANCELED") break;
      await new Promise(r => setTimeout(r, 2000));
      const poll = await fetch(`https://api.vercel.com/v13/deployments/${deployId}?teamId=${TEAM}`, {
        headers: { Authorization: `Bearer ${TOKEN}` },
      });
      const pollData = await poll.json();
      state = pollData.readyState ?? pollData.status;
      url = pollData.url ?? url;
    }

    return NextResponse.json({
      url: `https://${url}`,
      deploymentId: deployId,
      state,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[/api/builder/deploy] Error:", {
      timestamp: new Date().toISOString(),
      error: errorMsg,
      stack: err instanceof Error ? err.stack : undefined,
    });
    return NextResponse.json({ error: "Deploy failed" }, { status: 500 });
  }
}
