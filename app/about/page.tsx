import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata = { title: "About — Masidy" };

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-24">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 inline-block">← Back</Link>
        <h1 className="text-4xl font-display tracking-tight mb-6">About Masidy</h1>
        <p className="text-xl text-muted-foreground leading-relaxed mb-12">
          Masidy is an AI-powered application builder. Describe what you want to build, and Masidy writes the code, sets up the database, deploys it live, and hands you the URL — in under 60 seconds.
        </p>
        <div className="border-t border-foreground/10 pt-12 mb-12">
          <h2 className="text-2xl font-display tracking-tight mb-4">Our mission</h2>
          <p className="text-muted-foreground leading-relaxed">
            We believe building software should be as easy as describing an idea. Masidy removes every barrier between a thought and a live, production-ready application — so builders can focus on what matters: the product, not the infrastructure.
          </p>
        </div>
        <div className="border-t border-foreground/10 pt-12 mb-12">
          <h2 className="text-2xl font-display tracking-tight mb-4">How it works</h2>
          <div className="flex flex-col gap-6">
            {[
              { step: "01", title: "Describe", desc: "Type what you want to build in plain language." },
              { step: "02", title: "Build", desc: "Masidy AI writes production-ready code — frontend, backend, database schema." },
              { step: "03", title: "Deploy", desc: "One click deploys your app to a global edge network with SSL and a live URL." },
              { step: "04", title: "Iterate", desc: "Keep chatting to add features, fix bugs, or change the design." },
            ].map(s => (
              <div key={s.step} className="flex gap-6">
                <span className="text-xs font-mono text-muted-foreground w-8 shrink-0 mt-1">{s.step}</span>
                <div>
                  <p className="font-medium mb-1">{s.title}</p>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <Link href="/auth/signup"
          className="inline-flex items-center gap-2 bg-foreground text-background px-6 h-12 text-sm font-medium rounded-full hover:bg-foreground/90 transition-colors duration-150">
          Start building free <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
