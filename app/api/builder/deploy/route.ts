import { NextRequest, NextResponse } from "next/server";
import { BuilderDeployRequestSchema, parseBody } from "@/lib/validation";
import { rateLimit } from "@/lib/ratelimit";
import { createClient } from "@/lib/supabase/server";
import { deductCredits } from "@/lib/credits";
import { createAdminClient } from "@/lib/supabase/server";

const TOKEN = process.env.VERCEL_ACCESS_TOKEN;
const TEAM  = process.env.VERCEL_TEAM_ID;

/** Map Vercel API / HTTP errors to user-friendly messages. */
function friendlyDeployError(status: number, body: { error?: { code?: string; message?: string } }): string {
  // Vercel-specific error codes
  const code = body?.error?.code ?? "";
  if (code === "forbidden" || status === 403) return "Access denied. Check that your Vercel token has the correct permissions.";
  if (code === "not_found" || status === 404) return "Vercel project or team not found. Verify your VERCEL_TEAM_ID setting.";
  if (code === "rate_limited" || status === 429) return "Vercel rate limit reached. Please wait a moment and try again.";
  if (code === "payment_required" || status === 402) return "Your Vercel account has reached its deployment limit. Upgrade your Vercel plan to continue.";
  if (code === "build_failed") return "Build failed. Check your code for syntax errors and missing dependencies.";
  if (code === "invalid_token" || status === 401) return "Invalid Vercel token. Please update your VERCEL_ACCESS_TOKEN in environment variables.";
  if (status === 413) return "Project files are too large to deploy. Try removing unused assets.";
  if (status >= 500) return "Vercel is experiencing issues. Please try again in a few minutes.";
  // Fall back to the Vercel message if it looks user-friendly (short, no JSON)
  const msg = body?.error?.message ?? "";
  if (msg && msg.length < 120 && !msg.startsWith("{")) return msg;
  return "Deployment failed. Please try again.";
}

// Detect if files need Next.js or can be static
function detectFramework(files: { path: string; content: string }[]) {
  const hasNextConfig = files.some(f => f.path.includes("next.config"));
  const hasAppDir = files.some(f => f.path.startsWith("app/") || f.path.startsWith("src/app/"));
  const hasPagesDir = files.some(f => f.path.startsWith("pages/"));
  const hasReact = files.some(f => f.content.includes("import React") || f.content.includes("from 'react'") || f.content.includes('from "react"'));
  const hasHtml = files.some(f => f.path.endsWith(".html"));

  if (hasNextConfig || hasAppDir || hasPagesDir) return "nextjs";
  if (hasReact) return "react";
  if (hasHtml) return "static";
  return "nextjs"; // default
}

// Build a complete deployable file set
function buildDeployFiles(files: { path: string; content: string; language?: string }[], name: string) {
  const framework = detectFramework(files);
  const deployFiles: { file: string; data: string; encoding: string }[] = [];

  // Normalise file paths: strip leading "./" or "/"
  const normalisedFiles = files.map(f => ({
    ...f,
    path: f.path.replace(/^\.?\//, ""),
  }));

  // Add user files
  for (const f of normalisedFiles) {
    deployFiles.push({
      file: f.path,
      data: Buffer.from(f.content).toString("base64"),
      encoding: "base64",
    });
  }

  const hasPackageJson = normalisedFiles.some(f => f.path === "package.json");
  const hasNextConfig = normalisedFiles.some(f =>
    f.path === "next.config.js" || f.path === "next.config.mjs" || f.path === "next.config.ts"
  );
  const hasTsConfig = normalisedFiles.some(f => f.path === "tsconfig.json");
  const hasTailwindConfig = normalisedFiles.some(f =>
    f.path === "tailwind.config.js" || f.path === "tailwind.config.ts" || f.path === "tailwind.config.mjs"
  );
  const hasPostCssConfig = normalisedFiles.some(f => f.path === "postcss.config.js" || f.path === "postcss.config.mjs");
  const hasGlobalsCss = normalisedFiles.some(f => f.path === "app/globals.css");

  const hasAppPage = normalisedFiles.some(f =>
    f.path === "app/page.tsx" || f.path === "app/page.jsx" || f.path === "app/page.js"
  );
  const hasAppLayout = normalisedFiles.some(f =>
    f.path === "app/layout.tsx" || f.path === "app/layout.jsx"
  );

  // Detect whether the project uses Tailwind (AI almost always generates Tailwind code)
  const usesTailwind = hasTailwindConfig ||
    normalisedFiles.some(f => f.content.includes("tailwind") || f.content.includes("className="));

  if (framework === "nextjs") {
    // ── app/page.tsx ──────────────────────────────────────────────────────
    // If there's no app/page.tsx, try to re-export the first component file.
    // The re-export path must be relative to the app/ directory.
    if (!hasAppPage && !normalisedFiles.some(f => f.path.startsWith("pages/"))) {
      const firstComponent = normalisedFiles.find(f =>
        (f.path.endsWith(".tsx") || f.path.endsWith(".jsx")) &&
        !f.path.startsWith("app/") &&
        !f.path.startsWith("components/")
      ) ?? normalisedFiles.find(f => f.path.endsWith(".tsx") || f.path.endsWith(".jsx"));

      if (firstComponent) {
        // Path relative to app/ directory — strip extension and prepend "../"
        const importPath = `../${firstComponent.path.replace(/\.(tsx|jsx|ts|js)$/, "")}`;
        deployFiles.push({
          file: "app/page.tsx",
          data: Buffer.from(`export { default } from "${importPath}";`).toString("base64"),
          encoding: "base64",
        });
      } else {
        // No component found — generate a minimal placeholder page
        deployFiles.push({
          file: "app/page.tsx",
          data: Buffer.from(`export default function Page() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
      <h1>Hello from Masidy</h1>
    </main>
  );
}`).toString("base64"),
          encoding: "base64",
        });
      }
    }

    // ── app/layout.tsx ────────────────────────────────────────────────────
    if (!hasAppLayout) {
      const layoutContent = usesTailwind
        ? `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Masidy App",
  description: "Built with Masidy AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}`
        : `import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Masidy App",
  description: "Built with Masidy AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}`;
      deployFiles.push({
        file: "app/layout.tsx",
        data: Buffer.from(layoutContent).toString("base64"),
        encoding: "base64",
      });
    }

    // ── app/globals.css ───────────────────────────────────────────────────
    if (usesTailwind && !hasGlobalsCss) {
      deployFiles.push({
        file: "app/globals.css",
        data: Buffer.from(`@tailwind base;
@tailwind components;
@tailwind utilities;
`).toString("base64"),
        encoding: "base64",
      });
    }

    // ── package.json ──────────────────────────────────────────────────────
    if (!hasPackageJson) {
      const deps: Record<string, string> = {
        next: "14.2.5",
        react: "^18",
        "react-dom": "^18",
      };
      const devDeps: Record<string, string> = {
        typescript: "^5",
        "@types/node": "^20",
        "@types/react": "^18",
        "@types/react-dom": "^18",
      };
      if (usesTailwind) {
        devDeps["tailwindcss"] = "^3";
        devDeps["postcss"] = "^8";
        devDeps["autoprefixer"] = "^10";
      }
      deployFiles.push({
        file: "package.json",
        data: Buffer.from(JSON.stringify({
          name,
          version: "0.1.0",
          private: true,
          scripts: {
            dev: "next dev",
            build: "next build",
            start: "next start",
            lint: "next lint",
          },
          dependencies: deps,
          devDependencies: devDeps,
        }, null, 2)).toString("base64"),
        encoding: "base64",
      });
    }

    // ── next.config.mjs ───────────────────────────────────────────────────
    if (!hasNextConfig) {
      deployFiles.push({
        file: "next.config.mjs",
        data: Buffer.from(`/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
`).toString("base64"),
        encoding: "base64",
      });
    }

    // ── tailwind.config.ts ────────────────────────────────────────────────
    if (usesTailwind && !hasTailwindConfig) {
      deployFiles.push({
        file: "tailwind.config.ts",
        data: Buffer.from(`import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
`).toString("base64"),
        encoding: "base64",
      });
    }

    // ── postcss.config.js ─────────────────────────────────────────────────
    if (usesTailwind && !hasPostCssConfig) {
      deployFiles.push({
        file: "postcss.config.js",
        data: Buffer.from(`module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`).toString("base64"),
        encoding: "base64",
      });
    }

    // ── tsconfig.json ─────────────────────────────────────────────────────
    if (!hasTsConfig) {
      deployFiles.push({
        file: "tsconfig.json",
        data: Buffer.from(JSON.stringify({
          compilerOptions: {
            target: "es5",
            lib: ["dom", "dom.iterable", "esnext"],
            allowJs: true,
            skipLibCheck: true,
            strict: false,
            noEmit: true,
            esModuleInterop: true,
            module: "esnext",
            moduleResolution: "bundler",
            resolveJsonModule: true,
            isolatedModules: true,
            jsx: "preserve",
            incremental: true,
            plugins: [{ name: "next" }],
            paths: { "@/*": ["./*"] },
          },
          include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
          exclude: ["node_modules"],
        }, null, 2)).toString("base64"),
        encoding: "base64",
      });
    }
  }

  return { deployFiles, framework };
}

export async function POST(req: NextRequest) {
  try {
    // ── Check required env vars ──────────────────────────────────────────
    if (!TOKEN) {
      console.error("VERCEL_ACCESS_TOKEN is not set");
      return NextResponse.json(
        { error: "Deployment is not configured. Please add your Vercel token in environment variables." },
        { status: 503 }
      );
    }
    if (!TEAM) {
      console.error("VERCEL_TEAM_ID is not set");
      return NextResponse.json(
        { error: "Deployment is not configured. Please add your Vercel team ID in environment variables." },
        { status: 503 }
      );
    }

    // ── Auth ─────────────────────────────────────────────────────────────
    let userId: string | null = null;
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: "You must be signed in to deploy." }, { status: 401 });
      userId = user.id;
    }

    // ── Rate limit ───────────────────────────────────────────────────────
    const key = userId ?? req.headers.get("x-forwarded-for") ?? "anon";
    const { success } = rateLimit(`deploy:${key}`, 10, 60_000);
    if (!success) {
      return NextResponse.json(
        { error: "Too many deploy requests. Please wait 60 seconds and try again." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    // ── Validate ─────────────────────────────────────────────────────────
    const body = await req.json().catch(() => null);
    const { data, error } = parseBody(BuilderDeployRequestSchema, body);
    if (error || !data) return NextResponse.json({ error: error ?? "Invalid request body." }, { status: 400 });

    const { files, projectName } = data;
    const name = (projectName ?? `masidy-app-${Date.now()}`).toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 52);

    // ── Build deploy payload ─────────────────────────────────────────────
    const { deployFiles, framework } = buildDeployFiles(files, name);

    // ── Create Vercel deployment ─────────────────────────────────────────
    let deployRes: Response;
    let deployData: { id?: string; url?: string; readyState?: string; status?: string; error?: { code?: string; message?: string } };

    try {
      deployRes = await fetch(`https://api.vercel.com/v13/deployments?teamId=${TEAM}&forceNew=1`, {
        method: "POST",
        headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          files: deployFiles,
          projectSettings: {
            framework: framework === "nextjs" ? "nextjs" : null,
            buildCommand: framework === "nextjs" ? "next build" : null,
            outputDirectory: framework === "nextjs" ? null : ".",
            installCommand: framework === "nextjs" ? "npm install" : null,
          },
          target: "preview",
        }),
      });
      deployData = await deployRes.json();
    } catch (networkErr) {
      console.error("Network error reaching Vercel API:", networkErr);
      return NextResponse.json(
        { error: "Could not reach Vercel. Check your internet connection and try again." },
        { status: 502 }
      );
    }

    if (!deployRes.ok) {
      console.error("Vercel deploy error:", deployData);
      const friendlyMsg = friendlyDeployError(deployRes.status, deployData);
      return NextResponse.json({ error: friendlyMsg }, { status: deployRes.status });
    }

    const deployId = deployData.id!;
    let url = deployData.url!;
    let state: string = deployData.readyState ?? deployData.status ?? "BUILDING";
    const logs: string[] = [`[${new Date().toISOString()}] Deployment created: ${deployId}`];

    // ── Poll until ready (max 90s) ───────────────────────────────────────
    let timedOut = true;
    for (let i = 0; i < 45; i++) {
      if (state === "READY" || state === "ERROR" || state === "CANCELED") { timedOut = false; break; }
      await new Promise(r => setTimeout(r, 2000));

      try {
        const poll = await fetch(
          `https://api.vercel.com/v13/deployments/${deployId}?teamId=${TEAM}`,
          { headers: { Authorization: `Bearer ${TOKEN}` } }
        );
        const pollData = await poll.json();
        const prevState = state;
        state = pollData.readyState ?? pollData.status ?? state;
        url = pollData.url ?? url;
        if (state !== prevState) {
          logs.push(`[${new Date().toISOString()}] Status: ${state}`);
        }
      } catch {
        // Non-fatal — keep polling
      }
    }

    if (timedOut) {
      return NextResponse.json(
        { error: "Deployment timed out after 90 seconds. The build may still be running on Vercel.", logs },
        { status: 504 }
      );
    }

    if (state === "ERROR") {
      return NextResponse.json(
        { error: "Build failed. Check your code for syntax errors and missing dependencies.", logs },
        { status: 500 }
      );
    }

    if (state === "CANCELED") {
      return NextResponse.json(
        { error: "Deployment was canceled. Please try again.", logs },
        { status: 500 }
      );
    }

    const liveUrl = `https://${url}`;
    logs.push(`[${new Date().toISOString()}] ✓ Live at: ${liveUrl}`);

    // ── Save deployment to Supabase ──────────────────────────────────────
    if (userId) {
      try {
        const admin = createAdminClient();
        await admin.from("deployments").insert({
          user_id: userId,
          vercel_deployment_id: deployId,
          url: liveUrl,
          status: state,
          branch: "main",
          commit_message: `Built with Masidy AI`,
        });
      } catch (e) {
        console.warn("Failed to save deployment to Supabase:", e);
      }
    }

    return NextResponse.json({ url: liveUrl, deploymentId: deployId, state, logs });

  } catch (err) {
    console.error("Deploy error:", err);
    return NextResponse.json({ error: "An unexpected error occurred during deployment. Please try again." }, { status: 500 });
  }
}
