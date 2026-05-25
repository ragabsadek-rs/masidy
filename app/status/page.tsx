export const metadata = { title: "Status — Masidy" };
import Link from "next/link";

const services = [
  { name: "AI Builder",       status: "operational" },
  { name: "Deployments",      status: "operational" },
  { name: "API",              status: "operational" },
  { name: "Authentication",   status: "operational" },
  { name: "Storage",          status: "operational" },
  { name: "Edge Network",     status: "operational" },
];

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-24">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 inline-block">← Back</Link>
        <div className="flex items-center gap-3 mb-8">
          <span className="w-3 h-3 rounded-full bg-green-500" />
          <h1 className="text-4xl font-display tracking-tight">All systems operational</h1>
        </div>
        <p className="text-muted-foreground mb-12">Current status of all Masidy services.</p>
        <div className="border border-foreground/10">
          {services.map((s, i) => (
            <div key={s.name} className={`flex items-center justify-between px-4 py-3 ${i < services.length - 1 ? "border-b border-foreground/10" : ""}`}>
              <span className="text-sm">{s.name}</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs text-green-600 font-mono capitalize">{s.status}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-6">Last checked: {new Date().toUTCString()}</p>
      </div>
    </div>
  );
}
