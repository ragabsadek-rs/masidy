export interface Integration {
  id: string;
  slug: string;
  name: string;
  provider: string;
  category: string;
  description: string;
  tagline: string;
  status: "Featured" | "Popular" | "New" | "Verified";
  details: string[];
  highlights: string[];
  apiBaseUrl?: string;
  docsUrl?: string;
  callbackPath?: string;
  notes?: string;
}

export interface ProviderMeta {
  id: string;
  name: string;
  slug: string;
  description: string;
  accent: string;
  initial: string;
}

export const providerCatalog: ProviderMeta[] = [
  {
    id: "masidy",
    slug: "masidy",
    name: "Masidy",
    description: "Native Masidy integrations built for this platform.",
    accent: "#2563eb",
    initial: "M",
  },
  {
    id: "github",
    slug: "github",
    name: "GitHub",
    description: "Connect your GitHub repos, issues, and workflows.",
    accent: "#181717",
    initial: "GH",
  },
  {
    id: "slack",
    slug: "slack",
    name: "Slack",
    description: "Send alerts and notifications directly to Slack channels.",
    accent: "#4A154B",
    initial: "S",
  },
  {
    id: "stripe",
    slug: "stripe",
    name: "Stripe",
    description: "Process payments, subscriptions, and invoices.",
    accent: "#635BFF",
    initial: "St",
  },
  {
    id: "datadog",
    slug: "datadog",
    name: "Datadog",
    description: "Stream metrics and alerts to your Datadog dashboards.",
    accent: "#6633CC",
    initial: "D",
  },
  {
    id: "notion",
    slug: "notion",
    name: "Notion",
    description: "Publish docs and runbooks from Masidy directly to Notion.",
    accent: "#000000",
    initial: "N",
  },
  {
    id: "aws",
    slug: "aws",
    name: "Amazon Web Services",
    description: "Connect object storage and cloud services with Masidy.",
    accent: "#FF9900",
    initial: "AWS",
  },
  {
    id: "postgresql",
    slug: "postgresql",
    name: "PostgreSQL",
    description: "Sync event data and analytics into your own database.",
    accent: "#336791",
    initial: "PG",
  },
  {
    id: "sentry",
    slug: "sentry",
    name: "Sentry",
    description: "Report errors and release issues from Masidy.",
    accent: "#FF6000",
    initial: "Se",
  },
];

export const marketplaceIntegrations: Integration[] = [
  {
    id: "ai-assistant",
    slug: "ai-assistant",
    name: "Masidy AI Assistant",
    provider: "Masidy",
    category: "AI",
    description: "Build smart workflows and automation with Masidy-native AI agents.",
    tagline: "Add AI workflows to your workspace with one click.",
    status: "Featured",
    highlights: [
      "Custom prompt templates",
      "Automated workflow triggers",
      "Team-shared agent library",
    ],
    details: [
      "Use Masidy AI to summarize documents, generate reports, and automate ops.",
      "Connect to your existing data sources without leaving the platform.",
      "Configure access controls and billing in Masidy.",
    ],
    apiBaseUrl: "https://api.masidy.com/v1/ai",
    docsUrl: "https://docs.masidy.com/ai",
    callbackPath: "/api/marketplace/ai-assistant/callback",
    notes: "Install once and invoke Masidy AI workflows from your projects using the Masidy API.",
  },
  {
    id: "slack-sync",
    slug: "slack-sync",
    name: "Slack Sync",
    provider: "Slack",
    category: "Communication",
    description: "Send alerts, deploy notifications, and usage summaries to Slack.",
    tagline: "Keep your team in sync with real-time Masidy activity.",
    status: "Popular",
    highlights: ["Channel notifications", "Custom message templates", "OAuth connect"],
    details: [
      "Install once and route Masidy updates to your Slack workspace.",
      "Choose channels for deployment, billing, and AI alerts.",
      "Control which users can create notification rules.",
    ],
    apiBaseUrl: "https://slack.com/api",
    docsUrl: "https://api.slack.com",
    callbackPath: "/api/marketplace/slack/callback",
    notes: "Enable Slack notifications and events inside Masidy without leaving the dashboard.",
  },
  {
    id: "stripe-payments",
    slug: "stripe-payments",
    name: "Stripe Payments",
    provider: "Stripe",
    category: "Payments",
    description: "Accept payments, manage subscriptions, and track transaction history.",
    tagline: "Charge customers through Masidy with Stripe power.",
    status: "Verified",
    highlights: ["Checkout and subscriptions", "Payment reporting", "Invoice workflows"],
    details: [
      "Use Stripe to collect customer payments inside Masidy.",
      "View subscription status and billing events in one place.",
      "Keep provider setup secure with OAuth-based connect.",
    ],
    apiBaseUrl: "https://api.stripe.com",
    docsUrl: "https://stripe.com/docs/api",
    callbackPath: "/api/marketplace/stripe/callback",
    notes: "Connect your Stripe account once and manage payment integrations entirely from Masidy.",
  },
  {
    id: "github-connect",
    slug: "github-connect",
    name: "GitHub Connect",
    provider: "GitHub",
    category: "Developer",
    description: "Link repositories, sync issues, and automate code workflows.",
    tagline: "Bring your code lifecycle into Masidy.",
    status: "Popular",
    highlights: ["Repository access", "Issue automation", "Deploy hooks"],
    details: [
      "Link GitHub repos to Masidy projects for deployments and status updates.",
      "Enable pull request and release tracking directly in the dashboard.",
      "Trigger automations based on branch and commit activity.",
    ],
    apiBaseUrl: "https://api.github.com",
    docsUrl: "https://docs.github.com/en/rest",
    callbackPath: "/api/marketplace/github/callback",
    notes: "Install GitHub integration to keep repository and issue data synced inside Masidy.",
  },
  {
    id: "datadog-monitoring",
    slug: "datadog-monitoring",
    name: "Datadog Monitoring",
    provider: "Datadog",
    category: "Monitoring",
    description: "Stream metrics, alerts, and logs from Masidy to Datadog.",
    tagline: "Monitor Masidy resources with your Datadog dashboards.",
    status: "New",
    highlights: ["Alerts & dashboards", "Log forwarding", "Usage metrics"],
    details: [
      "Forward deployment, uptime, and error events to Datadog.",
      "Use Datadog dashboards for a unified ops view.",
      "Configure alert thresholds inside Masidy.",
    ],
    apiBaseUrl: "https://api.datadoghq.com/api/v1",
    docsUrl: "https://docs.datadoghq.com/api/latest/",
    callbackPath: "/api/marketplace/datadog/callback",
    notes: "Install Datadog monitoring to route Masidy metrics and alerts into your Datadog account.",
  },
  {
    id: "notion-sync",
    slug: "notion-sync",
    name: "Notion Sync",
    provider: "Notion",
    category: "Documentation",
    description: "Publish runbooks, dashboards, and team updates automatically.",
    tagline: "Keep your docs up to date while your team works.",
    status: "Verified",
    highlights: ["Page sync", "Automated notes", "Rich embeds"],
    details: [
      "Send status reports and runbook drafts to Notion pages.",
      "Auto-generate documentation from Masidy events.",
      "Keep your team aligned with latest system status.",
    ],
    apiBaseUrl: "https://api.notion.com/v1",
    docsUrl: "https://developers.notion.com/reference/intro",
    callbackPath: "/api/marketplace/notion/callback",
    notes: "Install Notion sync to publish documents and dashboards directly from Masidy.",
  },
  {
    id: "aws-storage",
    slug: "aws-storage",
    name: "AWS Storage",
    provider: "Amazon Web Services",
    category: "Storage",
    description: "Connect S3 and object storage for data export and backups.",
    tagline: "Store Masidy artifacts in the cloud you already use.",
    status: "New",
    highlights: ["S3 backup", "Artifact export", "Secure access"],
    details: [
      "Configure storage buckets for logs, exports, and backups.",
      "Access Masidy data with secure AWS credentials.",
      "Keep your storage usage centralized and auditable.",
    ],
    apiBaseUrl: "https://aws.amazon.com/cli",
    docsUrl: "https://docs.aws.amazon.com/",
    callbackPath: "/api/marketplace/aws/callback",
    notes: "Install AWS storage to sync artifacts and exports to S3 without leaving Masidy.",
  },
  {
    id: "postgres-db",
    slug: "postgres-db",
    name: "PostgreSQL Connector",
    provider: "PostgreSQL",
    category: "Database",
    description: "Sync events and analytics to your own database.",
    tagline: "Save Masidy event data where your teams already query.",
    status: "Popular",
    highlights: ["Data exports", "Custom queries", "Secure access"],
    details: [
      "Stream Masidy events and analytics into PostgreSQL.",
      "Build custom dashboards with your own queries.",
      "Keep historical records in your own database.",
    ],
    apiBaseUrl: "postgresql://<your-host>:5432/<database>",
    docsUrl: "https://www.postgresql.org/docs/current/libpq-connect.html",
    callbackPath: "/api/marketplace/postgresql/connect",
    notes: "Install PostgreSQL connector to persist Masidy events in your own database.",
  },
  {
    id: "sentry-errors",
    slug: "sentry-errors",
    name: "Sentry Errors",
    provider: "Sentry",
    category: "Security",
    description: "Send application errors and alerts to Sentry automatically.",
    tagline: "Track errors from Masidy in your existing observability stack.",
    status: "Featured",
    highlights: ["Error tracking", "Release health", "Issue grouping"],
    details: [
      "Report exceptions and performance issues to Sentry.",
      "Keep error context alongside Masidy deployment data.",
      "Use Sentry alerts to notify your ops teams.",
    ],
    apiBaseUrl: "https://sentry.io/api/0",
    docsUrl: "https://docs.sentry.io/api/",
    callbackPath: "/api/marketplace/sentry/callback",
    notes: "Install Sentry integration to forward Masidy errors and releases into your Sentry projects.",
  },
  // ── Masidy AI Agents ────────────────────────────────────────────────────
  {
    id: "masidy-lite",
    slug: "masidy-lite",
    name: "Masidy Lite",
    provider: "Masidy",
    category: "AI",
    description: "Fast AI code generator. Writes files, installs dependencies, searches the web, and deploys to Vercel. Best for quick builds.",
    tagline: "Quick questions, fixes, and explanations. Fast and cost-efficient.",
    status: "Featured",
    highlights: ["Write any file instantly", "Install npm dependencies", "Web search for docs", "Auto-deploy to Vercel"],
    details: [
      "Masidy Lite uses Claude Haiku for fast, focused code generation.",
      "Describe what you want and it writes all the files needed.",
      "Automatically deploys to Vercel so you get a live URL.",
      "0.5 credits per message — the most cost-efficient option.",
    ],
    apiBaseUrl: "https://masidy.app/api/builder/chat",
    docsUrl: "https://masidy.app/docs",
    callbackPath: "/builder?model=lite",
    notes: "Select Masidy Lite in the builder to use this agent. 0.5 credits per message.",
  },
  {
    id: "masidy-standard",
    slug: "masidy-standard",
    name: "Masidy Standard",
    provider: "Masidy",
    category: "AI",
    description: "Full-stack AI engineer. Builds complete apps with Supabase database, Stripe payments, Slack notifications, and GitHub integration.",
    tagline: "Feature implementation, tests, and refactors. Balanced speed and power.",
    status: "Featured",
    highlights: ["Create Supabase tables", "Set up Stripe products", "Push to GitHub", "Send Slack notifications"],
    details: [
      "Masidy Standard uses Claude Sonnet for balanced speed and capability.",
      "Builds complete production apps with database, payments, and notifications.",
      "Creates GitHub repos and pushes all code automatically.",
      "2 credits per message.",
    ],
    apiBaseUrl: "https://masidy.app/api/builder/chat",
    docsUrl: "https://masidy.app/docs",
    callbackPath: "/builder?model=standard",
    notes: "Select Masidy Standard in the builder. 2 credits per message.",
  },
  {
    id: "masidy-max",
    slug: "masidy-max",
    name: "Masidy Max",
    provider: "Masidy",
    category: "AI",
    description: "Fully autonomous AI software engineer. Plans, builds, deploys, monitors, and documents complete production applications end-to-end using 19+ tools.",
    tagline: "A fully autonomous, full-stack AI engineer that plans, codes, deploys, monitors, and operates production applications end-to-end.",
    status: "Featured",
    highlights: ["19+ MCP tools", "Sentry error tracking", "Datadog monitors", "Cloudflare Workers", "Linear issues", "Notion docs", "PostHog analytics"],
    details: [
      "Masidy Max uses Claude Opus — the most powerful model available.",
      "Fully autonomous: describe your app and it builds everything end-to-end.",
      "Sets up error tracking (Sentry), monitoring (Datadog), analytics (PostHog).",
      "Creates Linear issues, writes Notion documentation, deploys Cloudflare Workers.",
      "5 credits per message.",
    ],
    apiBaseUrl: "https://masidy.app/api/builder/chat",
    docsUrl: "https://masidy.app/docs",
    callbackPath: "/builder?model=opus",
    notes: "Select Masidy Max in the builder for full autonomous operation. 5 credits per message.",
  },
];

export function getIntegrationBySlug(slug: string) {
  return marketplaceIntegrations.find((item) => item.slug === slug);
}

export function getIntegrationCategories() {
  return Array.from(new Set(marketplaceIntegrations.map((item) => item.category))).sort();
}

export function getProviders() {
  return providerCatalog;
}

export function getProviderMeta(provider: string) {
  return providerCatalog.find((item) => item.name === provider || item.slug === provider.toLowerCase());
}
