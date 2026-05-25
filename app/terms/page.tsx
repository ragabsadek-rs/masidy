import Link from "next/link";

export const metadata = { title: "Terms of Service — Masidy" };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-24">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 inline-block">← Back</Link>
        <h1 className="text-4xl font-display tracking-tight mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-12">Last updated: May 2025</p>
        {[
          { title: "1. Acceptance", body: "By accessing or using Masidy, you agree to be bound by these Terms. If you do not agree, do not use the service." },
          { title: "2. Service Description", body: "Masidy is an AI-powered application builder that generates, deploys, and manages web applications on your behalf using cloud infrastructure." },
          { title: "3. Credits & Billing", body: "Masidy operates on a credit-based system. Credits are purchased in advance and consumed per action. Credits do not expire. All purchases are final and non-refundable unless required by law." },
          { title: "4. Acceptable Use", body: "You may not use Masidy to build applications that violate laws, infringe intellectual property, distribute malware, or engage in fraud. We reserve the right to suspend accounts that violate these terms." },
          { title: "5. Data & Privacy", body: "We store only what is necessary to provide the service. Your code and deployments are yours. We do not sell your data. See our Privacy Policy for details." },
          { title: "6. Uptime & SLA", body: "We target 99.9% uptime but do not guarantee uninterrupted service. Scheduled maintenance will be announced in advance." },
          { title: "7. Termination", body: "You may delete your account at any time. We may suspend or terminate accounts that violate these terms. Unused credits are non-refundable upon termination." },
          { title: "8. Limitation of Liability", body: "Masidy is provided 'as is'. We are not liable for indirect, incidental, or consequential damages arising from use of the service." },
          { title: "9. Changes", body: "We may update these terms. Continued use after changes constitutes acceptance. We will notify users of material changes by email." },
          { title: "10. Contact", body: "For questions about these terms, contact us at legal@masidy.app." },
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
