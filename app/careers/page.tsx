import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata = { title: "Careers — Masidy" };

const openRoles = [
  { title: "Full-Stack Engineer",    type: "Full-time", location: "Remote",  desc: "Build the core Masidy platform — AI pipeline, deployment infrastructure, and developer tooling." },
  { title: "AI/ML Engineer",         type: "Full-time", location: "Remote",  desc: "Improve code generation quality, fine-tune prompts, and build evaluation pipelines." },
  { title: "Product Designer",       type: "Full-time", location: "Remote",  desc: "Design the future of AI-powered development tools. Own the end-to-end user experience." },
  { title: "Developer Advocate",     type: "Full-time", location: "Remote",  desc: "Help developers get the most out of Masidy. Create content, run workshops, build community." },
];

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-24">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 inline-block">← Back</Link>
        <h1 className="text-4xl font-display tracking-tight mb-2">Careers</h1>
        <p className="text-muted-foreground mb-4">We're building the future of software development. Join us.</p>
        <p className="text-sm text-muted-foreground mb-12">All roles are fully remote. We care about what you build, not where you build it.</p>

        <div className="flex flex-col gap-3">
          {openRoles.map((role) => (
            <div key={role.title} className="border border-foreground/10 p-5 hover:border-foreground/25 transition-colors duration-150 group">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h2 className="text-sm font-medium">{role.title}</h2>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono border border-foreground/10 px-2 py-0.5 text-muted-foreground">{role.type}</span>
                  <span className="text-[10px] font-mono border border-foreground/10 px-2 py-0.5 text-muted-foreground">{role.location}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">{role.desc}</p>
              <a href={`mailto:careers@masidy.app?subject=Application: ${role.title}`}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150 group-hover:text-foreground">
                Apply <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-foreground/10 pt-8">
          <p className="text-sm text-muted-foreground">Don't see your role? Send us a note at <a href="mailto:careers@masidy.app" className="text-foreground underline underline-offset-4">careers@masidy.app</a></p>
        </div>
      </div>
    </div>
  );
}
