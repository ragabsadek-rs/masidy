import { NextRequest, NextResponse } from "next/server";
import { BuilderDeployRequestSchema, parseBody } from "@/lib/validation";
import { rateLimit } from "@/lib/ratelimit";
import { createClient } from "@/lib/supabase/server";
import { deductCredits } from "@/lib/credits";

const TOKEN = process.env.VERCEL_ACCESS_TOKEN!;
const TEAM  = process.env.VERCEL_TEAM_ID!;

export async function POST(req: NextRequest) {
  try {
    // Auth
    let userId: string | null = null;
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      userId = user.id;
    }

    // Rate limit
    const key = userId ?? req.headers.get("x-forwarded-for") ?? "anon";
    const { success } = rateLimit(`deploy:${key}`, 10, 60_000);
    if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });

    // Validate
    const body = await req.json().catch(() => null);
    const { data, error } = parseBody(BuilderDeployRequestSchema, body);
    if (error || !data) return NextResponse.json({ error: error ?? "Invalid request" }, { status: 400 });

    const { files, projectName } = data;

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

    const deployRes = await fetch(`https://api.vercel.com/v13/deployments?teamId=${TEAM}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        files: deployFiles,
        projectSettings: { framework: "nextjs", buildCommand: "next build", outputDirectory: ".next" },
        target: "preview",
      }),
    });

    const deployData = await deployRes.json();

    if (!deployRes.ok) {
      return NextResponse.json({ error: deployData.error?.message ?? "Deploy failed" }, { status: deployRes.status });
    }

    // Poll for ready state (max 60s)
    const deployId = deployData.id;
    let url = deployData.url;
    let state = deployData.readyState ?? deployData.status;

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
    console.error("Deploy error:", err);
    return NextResponse.json({ error: "Deploy failed" }, { status: 500 });
  }
}
