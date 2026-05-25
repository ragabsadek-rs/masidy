import Link from "next/link";

export const metadata = { title: "Privacy Policy — Masidy" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-24">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 inline-block">← Back</Link>
        <h1 className="text-4xl font-display tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-12">Last updated: May 2025</p>
        {[
          { title: "What we collect", body: "We collect your email address, authentication data, and usage data (credit transactions, deployments). We do not collect payment card details — those are handled by Stripe." },
          { title: "How we use it", body: "We use your data to provide the service, send transactional emails (deployment notifications, billing receipts), and improve Masidy. We do not use your data for advertising." },
          { title: "Data storage", body: "Your data is stored in Supabase (PostgreSQL) hosted on AWS in the US East region. Deployments are hosted on Vercel's global edge network." },
          { title: "Your code", body: "Code you generate with Masidy belongs to you. We do not use your generated code to train AI models. We store it only to serve your deployments." },
          { title: "Third parties", body: "We use Stripe for payments, Supabase for database, and Vercel for deployment infrastructure. Each has their own privacy policy. We do not sell your data to any third party." },
          { title: "Cookies", body: "We use session cookies for authentication only. We do not use tracking or advertising cookies." },
          { title: "Your rights", body: "You can request deletion of your account and all associated data at any time by emailing privacy@masidy.app. We will process requests within 30 days." },
          { title: "Contact", body: "For privacy questions: privacy@masidy.app" },
        ].map(s => (
          <div key={s.title} className="mb-8">
            <h2 className="text-lg font-medium mb-2">{s.title}</h2>
            <p className="text-muted-foreground leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
