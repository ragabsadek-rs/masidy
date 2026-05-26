// ── Agent tool definitions for each tier ─────────────────────────────────
// These are passed to Claude's tool_use API

export type AgentTier = "lite" | "standard" | "opus";

// ── Core file tools (all tiers) ───────────────────────────────────────────

const FILE_TOOLS = [
  {
    name: "write_file",
    description: "Write or overwrite a file in the project. Creates any file: pages, components, API routes, configs, styles, etc. ALWAYS write complete file content.",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "File path relative to project root, e.g. 'app/page.tsx', 'components/Button.tsx', 'package.json'" },
        content: { type: "string", description: "Complete file content. Never truncate. Write the full file every time." },
        language: { type: "string", description: "File language: typescript, javascript, css, json, markdown, html, etc." },
      },
      required: ["path", "content", "language"],
    },
  },
  {
    name: "read_file",
    description: "Read an existing file from the project to understand current code before making changes.",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "File path to read" },
      },
      required: ["path"],
    },
  },
  {
    name: "list_files",
    description: "List all files currently in the project.",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "install_dependency",
    description: "Add a npm package to package.json. Use when you need a library not yet in the project.",
    input_schema: {
      type: "object",
      properties: {
        package: { type: "string", description: "Package name, e.g. 'zod', 'react-hook-form', 'framer-motion'" },
        version: { type: "string", description: "Version string e.g. '^3.0.0'. Use 'latest' if unsure." },
        dev: { type: "boolean", description: "True if devDependency" },
      },
      required: ["package", "version"],
    },
  },
  {
    name: "web_search",
    description: "Search the web for documentation, library APIs, or technical information needed to build the app.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
      },
      required: ["query"],
    },
  },
  {
    name: "deploy",
    description: "Deploy the current project files to Vercel and get a live URL.",
    input_schema: {
      type: "object",
      properties: {
        message: { type: "string", description: "What was built/changed in this deployment" },
      },
      required: ["message"],
    },
  },
  {
    name: "done",
    description: "Signal that you have finished building. Provide a summary of what was built.",
    input_schema: {
      type: "object",
      properties: {
        summary: { type: "string", description: "What was built, what files were created, and what the app does" },
        auto_deploy: { type: "boolean", description: "Whether to automatically deploy after this message" },
      },
      required: ["summary"],
    },
  },
];

// ── Standard tier additional tools ────────────────────────────────────────

const STANDARD_TOOLS = [
  {
    name: "create_supabase_table",
    description: "Create a new table in Supabase with the given SQL schema. Use for database-backed apps.",
    input_schema: {
      type: "object",
      properties: {
        sql: { type: "string", description: "SQL CREATE TABLE statement with RLS policies" },
        description: { type: "string", description: "What this table is for" },
      },
      required: ["sql", "description"],
    },
  },
  {
    name: "run_sql",
    description: "Run a SQL query against the Supabase database. Use for migrations, seeding data, or schema changes.",
    input_schema: {
      type: "object",
      properties: {
        sql: { type: "string", description: "SQL to execute" },
      },
      required: ["sql"],
    },
  },
  {
    name: "create_stripe_product",
    description: "Create a Stripe product and price for payment integration.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Product name" },
        description: { type: "string", description: "Product description" },
        price_cents: { type: "number", description: "Price in cents, e.g. 2999 for $29.99" },
        currency: { type: "string", description: "Currency code, e.g. 'usd'" },
        recurring: { type: "boolean", description: "True for subscription, false for one-time" },
        interval: { type: "string", description: "Billing interval: 'month' or 'year' (only for recurring)" },
      },
      required: ["name", "price_cents", "currency"],
    },
  },
  {
    name: "send_slack_message",
    description: "Send a notification to a Slack channel. Use to notify about deployments, errors, or events.",
    input_schema: {
      type: "object",
      properties: {
        message: { type: "string", description: "Message to send" },
        channel: { type: "string", description: "Channel name or ID (optional, uses default if not set)" },
      },
      required: ["message"],
    },
  },
  {
    name: "create_github_repo",
    description: "Create a new GitHub repository for the project.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Repository name" },
        description: { type: "string", description: "Repository description" },
        private: { type: "boolean", description: "True for private repo" },
      },
      required: ["name"],
    },
  },
  {
    name: "push_to_github",
    description: "Push all project files to a GitHub repository.",
    input_schema: {
      type: "object",
      properties: {
        repo: { type: "string", description: "Repository name (owner/repo format)" },
        message: { type: "string", description: "Commit message" },
        branch: { type: "string", description: "Branch name, defaults to 'main'" },
      },
      required: ["repo", "message"],
    },
  },
];

// ── Max tier additional tools ─────────────────────────────────────────────

const MAX_TOOLS = [
  {
    name: "create_sentry_project",
    description: "Create a Sentry project for error tracking and set up the DSN in the app.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Project name" },
        platform: { type: "string", description: "Platform: 'javascript-nextjs', 'node', etc." },
      },
      required: ["name", "platform"],
    },
  },
  {
    name: "create_datadog_monitor",
    description: "Create a Datadog monitor for application performance monitoring.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Monitor name" },
        type: { type: "string", description: "Monitor type: 'metric alert', 'service check', etc." },
        query: { type: "string", description: "Monitor query" },
        message: { type: "string", description: "Alert message" },
      },
      required: ["name", "type", "query"],
    },
  },
  {
    name: "create_cloudflare_worker",
    description: "Create a Cloudflare Worker for edge computing, caching, or API proxying.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Worker name" },
        script: { type: "string", description: "Worker JavaScript code" },
      },
      required: ["name", "script"],
    },
  },
  {
    name: "create_linear_issue",
    description: "Create a Linear issue to track a feature, bug, or task.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Issue title" },
        description: { type: "string", description: "Issue description" },
        priority: { type: "number", description: "Priority: 0=no priority, 1=urgent, 2=high, 3=medium, 4=low" },
      },
      required: ["title"],
    },
  },
  {
    name: "create_notion_page",
    description: "Create a Notion page for documentation, README, or architecture notes.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Page title" },
        content: { type: "string", description: "Page content in markdown" },
      },
      required: ["title", "content"],
    },
  },
  {
    name: "setup_posthog",
    description: "Set up PostHog analytics tracking in the app.",
    input_schema: {
      type: "object",
      properties: {
        project_name: { type: "string", description: "PostHog project name" },
      },
      required: ["project_name"],
    },
  },
  {
    name: "create_netlify_site",
    description: "Deploy the project to Netlify as an alternative to Vercel.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Site name" },
      },
      required: ["name"],
    },
  },
];

// ── Tool sets per tier ────────────────────────────────────────────────────

export const AGENT_TOOLS: Record<AgentTier, object[]> = {
  lite: FILE_TOOLS,
  standard: [...FILE_TOOLS, ...STANDARD_TOOLS],
  opus: [...FILE_TOOLS, ...STANDARD_TOOLS, ...MAX_TOOLS],
};

// ── Agent metadata ────────────────────────────────────────────────────────

export const AGENT_INFO: Record<AgentTier, {
  name: string;
  model: string;
  description: string;
  tagline: string;
  capabilities: string[];
  tools: string[];
  maxIterations: number;
  creditsPerMessage: number;
}> = {
  lite: {
    name: "Masidy Lite",
    model: "claude-haiku-4-5",
    description: "Fast AI code generator. Writes files, installs dependencies, and deploys. Best for quick builds and simple apps.",
    tagline: "Quick questions, fixes, and explanations. Fast and cost-efficient.",
    capabilities: [
      "Write any file (pages, components, API routes, styles)",
      "Install npm dependencies",
      "Search the web for docs and APIs",
      "Deploy to Vercel automatically",
      "Read and edit existing files",
    ],
    tools: ["write_file", "read_file", "list_files", "install_dependency", "web_search", "deploy"],
    maxIterations: 5,
    creditsPerMessage: 0.5,
  },
  standard: {
    name: "Masidy Standard",
    model: "claude-sonnet-4-5",
    description: "Full-stack AI engineer. Builds complete apps with database, payments, and notifications. Best for production-ready applications.",
    tagline: "Feature implementation, tests, and refactors. Balanced speed and power.",
    capabilities: [
      "Everything in Lite",
      "Create Supabase tables and run SQL migrations",
      "Set up Stripe products and payment flows",
      "Send Slack notifications",
      "Create and push to GitHub repositories",
      "Deploy to Vercel with full project setup",
    ],
    tools: ["write_file", "read_file", "list_files", "install_dependency", "web_search", "deploy", "create_supabase_table", "run_sql", "create_stripe_product", "send_slack_message", "create_github_repo", "push_to_github"],
    maxIterations: 10,
    creditsPerMessage: 2,
  },
  opus: {
    name: "Masidy Max",
    model: "claude-opus-4-5",
    description: "Fully autonomous AI software engineer. Plans, builds, deploys, monitors, and documents complete production applications end-to-end.",
    tagline: "A fully autonomous, full-stack AI engineer that plans, codes, deploys, monitors, and operates production applications end-to-end.",
    capabilities: [
      "Everything in Standard",
      "Set up Sentry error tracking",
      "Create Datadog performance monitors",
      "Deploy Cloudflare Workers for edge computing",
      "Create Linear issues for project tracking",
      "Write Notion documentation",
      "Set up PostHog analytics",
      "Deploy to Netlify as alternative",
      "Full autonomous plan → build → deploy → monitor loop",
    ],
    tools: ["write_file", "read_file", "list_files", "install_dependency", "web_search", "deploy", "create_supabase_table", "run_sql", "create_stripe_product", "send_slack_message", "create_github_repo", "push_to_github", "create_sentry_project", "create_datadog_monitor", "create_cloudflare_worker", "create_linear_issue", "create_notion_page", "setup_posthog", "create_netlify_site"],
    maxIterations: 20,
    creditsPerMessage: 5,
  },
};
