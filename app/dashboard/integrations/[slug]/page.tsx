import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { getIntegrationBySlug } from "@/lib/integrations";
import { InstallIntegrationButton } from "@/components/marketplace/install-integration-button";
import { ProviderLogo } from "@/components/marketplace/provider-logo";
import { IntegrationSetupDetails } from "@/components/marketplace/integration-setup-details";

interface DashboardIntegrationPageProps {
  params: {
    slug: string;
  };
}

export default function DashboardIntegrationDetailPage({ params }: DashboardIntegrationPageProps) {
  const integration = getIntegrationBySlug(params.slug);

  if (!integration) {
    return notFound();
  }

  return (
    <main className="relative min-h-screen bg-background py-12 px-6 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Integration details</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">{integration.name}</h1>
            <p className="mt-4 max-w-2xl text-base text-muted-foreground">{integration.description}</p>
          </div>
          <div className="rounded-3xl border border-foreground/10 bg-card/80 p-5 text-sm text-muted-foreground shadow-sm shadow-black/5">
            <p className="font-semibold text-foreground">Provider</p>
            <div className="mt-4 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-background">
                <ProviderLogo provider={integration.provider} className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{integration.provider}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{integration.category}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-3xl border border-foreground/10 bg-card/80 p-8 shadow-sm shadow-black/5">
            <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              Step-by-step setup
            </div>
            <ol className="mt-6 space-y-5 text-sm leading-7 text-foreground/90">
              <li className="rounded-3xl border border-foreground/10 bg-background p-5">
                <p className="font-semibold">1. Review the integration details</p>
                <p className="mt-2 text-muted-foreground">Everything happens inside Masidy, from configuration to installation.</p>
              </li>
              <li className="rounded-3xl border border-foreground/10 bg-background p-5">
                <p className="font-semibold">2. Install the integration</p>
                <p className="mt-2 text-muted-foreground">Click the install button in the sidebar to enable this provider for your workspace.</p>
              </li>
              <li className="rounded-3xl border border-foreground/10 bg-background p-5">
                <p className="font-semibold">3. Configure API access</p>
                <p className="mt-2 text-muted-foreground">Masidy will surface any required API endpoint, callback URL, or secret inside the dashboard.</p>
              </li>
              <li className="rounded-3xl border border-foreground/10 bg-background p-5">
                <p className="font-semibold">4. Manage it from Masidy</p>
                <p className="mt-2 text-muted-foreground">All settings stay within Masidy so users do not need to navigate away to the provider portal.</p>
              </li>
            </ol>
            <div className="mt-8 rounded-3xl border border-foreground/10 bg-background p-5 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">Note</p>
              <p className="mt-2">This workflow is built to keep users within Masidy for install and configuration, not for provider site navigation.</p>
            </div>
          </section>

          <aside className="space-y-6 rounded-3xl border border-foreground/10 bg-card/80 p-6 shadow-sm shadow-black/5">
            <div className="rounded-3xl border border-foreground/10 bg-background p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Quick start</p>
              <div className="mt-6 space-y-4 text-sm leading-7 text-foreground/90">
                <p>Install the integration to get access to provider sync, alerts, and dashboard automation.</p>
                <p>Once installed, Masidy will provide the API endpoint or connection details directly on this page.</p>
              </div>
            </div>
            <IntegrationSetupDetails
              apiBaseUrl={integration.apiBaseUrl}
              docsUrl={integration.docsUrl}
              callbackPath={integration.callbackPath}
              notes={integration.notes}
            />
            <InstallIntegrationButton integration={integration} />
            <Link href="/dashboard/integrations" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80">
              <ArrowRight className="h-4 w-4" /> Back to integrations
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
