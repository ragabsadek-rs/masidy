# Implementation Plan: Agent Platform — Full MCP Tool Integration

## Overview

Wire all 3 Masidy agents (Lite/Standard/Max) with their full MCP tool sets so each agent works end-to-end autonomously. Update the builder to route to the correct agent. Add all agents and their capabilities to the marketplace. Update the landing page to showcase what each agent can do.

## Tasks

- [ ] 1. Create `lib/agent-tools.ts` — define all MCP tool schemas for each agent tier
  - Lite tools: write_file, read_file, list_files, install_dependency, deploy, done, web_search
  - Standard tools: all Lite tools + create_supabase_table, run_sql, create_stripe_product, send_slack_message, create_github_repo, push_to_github, create_vercel_project
  - Max tools: all Standard tools + create_sentry_project, setup_datadog_monitor, create_cloudflare_worker, create_linear_issue, create_notion_page, setup_posthog, create_netlify_site, setup_zapier_webhook, create_planetscale_db

- [ ] 2. Create `lib/mcp-executors.ts` — implement real MCP tool execution using existing env vars
  - GitHub: create repo, push files via GitHub API
  - Vercel: create project, deploy via existing Vercel API helpers
  - Supabase: run SQL migrations via existing Supabase admin client
  - Stripe: create products/prices via existing Stripe client
  - Slack: send messages via Slack webhook
  - Sentry: create project via Sentry API
  - Datadog: create monitor via Datadog API
  - Cloudflare: create worker via Cloudflare API
  - Linear: create issue via Linear API
  - Notion: create page via Notion API
  - PostHog: create project via PostHog API

- [ ] 3. Update `app/api/builder/chat/route.ts` — route to correct agent with correct tools
  - Lite: uses SYSTEM_PROMPT_LITE + lite tools only
  - Standard: uses SYSTEM_PROMPT_STANDARD + standard tools
  - Max: uses SYSTEM_PROMPT_OPUS + all tools, max iterations 20
  - Execute real MCP tool calls when AI calls them
  - Stream tool execution status back to client

- [ ] 4. Create `app/api/builder/agent/[model]/route.ts` — dedicated agent endpoints
  - GET: returns agent info (name, description, tools, capabilities)
  - POST: runs the agent with the given prompt

- [ ] 5. Update builder page to show agent capabilities and tool execution
  - Show which agent is selected with its full capability list
  - Show real-time tool execution in the terminal (e.g. "Creating GitHub repo...", "Running SQL migration...")
  - Show tool results inline in chat (repo URL, deployment URL, etc.)
  - Add agent selector with descriptions of what each can do

- [ ] 6. Create `app/dashboard/agent/tools/page.tsx` — real MCP tools dashboard
  - Show all available tools per agent
  - Show tool execution history
  - Show connected integrations status (GitHub connected/not, Slack connected/not, etc.)

- [ ] 7. Update marketplace with all 3 agents as installable integrations
  - Add Masidy Lite, Masidy Standard, Masidy Max as marketplace items
  - Each shows: what it can do, what tools it uses, example prompts
  - "Use this agent" button opens builder with that agent pre-selected

- [ ] 8. Update landing page to showcase agent capabilities
  - Update features section: show the 3 agents with their tool lists
  - Update how-it-works: show real agent workflow (describe → agent plans → uses tools → deploys)
  - Add new "Agents" section showing what each agent can autonomously do
  - Update hero chips with real agent-powered examples

- [ ] 9. Add `.env.example` entries for all MCP tool API keys
  - GITHUB_TOKEN, SLACK_WEBHOOK_URL, SENTRY_AUTH_TOKEN, DATADOG_API_KEY
  - CLOUDFLARE_API_TOKEN, LINEAR_API_KEY, NOTION_API_KEY
  - POSTHOG_API_KEY, AMPLITUDE_API_KEY, HONEYCOMB_API_KEY

- [ ] 10. Commit and push everything, verify build passes

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": [1, 2, 9] },
    { "wave": 2, "tasks": [3, 4] },
    { "wave": 3, "tasks": [5, 6] },
    { "wave": 4, "tasks": [7, 8] },
    { "wave": 5, "tasks": [10] }
  ]
}
```

## Notes

- All MCP tool calls happen server-side — API keys never exposed to client
- Tools that require user-specific credentials (GitHub token, Slack webhook) should check if the user has connected that integration in their profile
- If a tool's API key is not configured, the agent gracefully skips it and notes it in the terminal
- The builder terminal shows real-time tool execution so users see exactly what the agent is doing
