import Link from "next/link";

export const metadata = { title: "API Reference — Masidy" };

const endpoints = [
  { method: "POST", path: "/api/builder/chat",    desc: "Send a message to the Masidy AI builder",    auth: true },
  { method: "POST", path: "/api/builder/deploy",  desc: "Deploy generated files to production",        auth: true },
  { method: "GET",  path: "/api/credits/balance", desc: "Get current credit balance",                  auth: true },
  { method: "POST", path: "/api/checkout",        desc: "Create a Stripe checkout session for credits", auth: true },
  { method: "GET",  path: "/api/vercel/deployments", desc: "List all deployments",                     auth: true },
  { method: "GET",  path: "/api/vercel/domains",  desc: "List custom domains",                         auth: true },
  { method: "POST", path: "/api/vercel/domains",  desc: "Add a custom domain",                         auth: true },
  { method: "GET",  path: "/api/vercel/env",      desc: "List environment variables (keys only)",      auth: true },
  { method: "POST", path: "/api/vercel/env",      desc: "Create an environment variable",              auth: true },
];

const methodColor: Record<string, string> = {
  GET:    "text-green-600 bg-green-500/10",
  POST:   "text-blue-600 bg-blue-500/10",
  DELETE: "text-red-600 bg-red-500/10",
};

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-24">
        <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 inline-block">← Docs</Link>
        <h1 className="text-4xl font-display tracking-tight mb-2">API Reference</h1>
        <p className="text-muted-foreground mb-4">All API routes require authentication via Supabase session cookie.</p>
        <div className="border border-foreground/10 mb-8 p-4 bg-foreground/[0.02]">
          <p className="text-xs font-mono text-muted-foreground">Base URL: <span className="text-foreground">{process.env.NEXT_PUBLIC_APP_URL ?? "https://masidy.app"}</span></p>
        </div>
        <div className="border border-foreground/10">
          {endpoints.map((ep, i) => (
            <div key={ep.path} className={`flex items-start gap-4 px-4 py-4 ${i < endpoints.length - 1 ? "border-b border-foreground/10" : ""}`}>
              <span className={`text-[10px] font-mono px-2 py-0.5 shrink-0 mt-0.5 ${methodColor[ep.method] ?? "text-muted-foreground bg-foreground/5"}`}>
                {ep.method}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono mb-0.5">{ep.path}</p>
                <p className="text-xs text-muted-foreground">{ep.desc}</p>
              </div>
              {ep.auth && <span className="text-[10px] font-mono text-muted-foreground border border-foreground/10 px-1.5 py-0.5 shrink-0">auth</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
