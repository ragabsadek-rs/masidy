import { NextRequest, NextResponse } from "next/server";

const TOKEN = process.env.VERCEL_ACCESS_TOKEN!;
const TEAM  = process.env.VERCEL_TEAM_ID!;

interface FileNode { path: string; content: string; language?: string; }

export async function POST(req: NextRequest) {
  try {
    const { files, projectName } = await req.json() as { files: FileNode[]; projectName?: string };
    if (!files?.length) return NextResponse.json({ error: "No files" }, { status: 400 });

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
    console.error("Deploy error:", err);
    return NextResponse.json({ error: "Deploy failed" }, { status: 500 });
  }
}
