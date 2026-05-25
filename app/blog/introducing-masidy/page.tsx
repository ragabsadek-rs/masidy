import Link from "next/link";

export const metadata = { title: "Introducing Masidy — Masidy Blog" };

export default function Post() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-24">
        <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 inline-block">← Blog</Link>
        <div className="flex items-center gap-3 mb-6">
          <span className="text-xs font-mono text-muted-foreground">May 25, 2025</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs font-mono text-muted-foreground">3 min read</span>
        </div>
        <h1 className="text-4xl font-display tracking-tight mb-8">Introducing Masidy — Describe it. We build it.</h1>
        <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed space-y-6">
          <p>Today we're launching Masidy — an AI-powered application builder that turns a single sentence into a live, production-ready application.</p>
          <p>The idea is simple: you describe what you want to build, and Masidy handles everything else. It writes the code, sets up the database, deploys it to a global edge network, and hands you a live URL — in under 60 seconds.</p>
          <h2 className="text-xl font-display text-foreground mt-8 mb-4">Why we built this</h2>
          <p>Building software has never been more accessible — but it's still too slow. Even experienced developers spend hours on boilerplate, configuration, and deployment before writing a single line of meaningful code.</p>
          <p>We believe the gap between an idea and a working product should be measured in seconds, not days. Masidy is our answer to that.</p>
          <h2 className="text-xl font-display text-foreground mt-8 mb-4">How it works</h2>
          <p>Type what you want to build. Masidy's AI generates the full codebase — frontend, backend, and database schema. You can review and edit every file in the built-in Monaco editor. When you're ready, one click deploys it live.</p>
          <p>The credit system means you only pay for what you use. No subscriptions, no monthly minimums. Buy credits when you need them, use them at your own pace.</p>
          <h2 className="text-xl font-display text-foreground mt-8 mb-4">What's next</h2>
          <p>This is just the beginning. We're working on team collaboration, custom AI agents, and deeper integrations with the tools you already use.</p>
          <p>Try it free — you get 10 credits on signup, enough to build and deploy your first app.</p>
        </div>
        <div className="mt-12 pt-8 border-t border-foreground/10">
          <Link href="/auth/signup"
            className="inline-flex items-center gap-2 bg-foreground text-background px-6 h-10 text-sm font-medium hover:bg-foreground/90 transition-colors duration-150">
            Start building free →
          </Link>
        </div>
      </div>
    </div>
  );
}
