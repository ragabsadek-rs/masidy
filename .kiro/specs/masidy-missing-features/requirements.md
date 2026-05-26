# Requirements Document

## Introduction

Masidy is an AI-powered platform where users describe what they want to build, Claude AI writes the code, and it deploys live to Vercel automatically. The platform uses a credit-based billing system (Stripe), Supabase for auth and data, and a full dashboard modeled after Vercel's UI.

This document specifies the eight missing feature areas required to make Masidy a complete, production-ready product:

1. Persistent Builder Projects — save/load/manage projects in Supabase
2. Per-User Vercel Project Isolation — each user gets their own Vercel project per build
3. Persistent Chat History — write and read builder messages from Supabase
4. Stripe Webhook Verification — end-to-end verified payment flow
5. Team / Workspace Support — multi-user teams with shared projects and billing
6. Real AI Gateway — a multi-provider proxy with API key management and rate limiting
7. Template Marketplace — real starter templates that pre-populate the builder
8. Mobile Experience — responsive dashboard and chat-only builder on mobile

All UI must follow the Masidy design system: `bg-background`, sharp corners (no `rounded-lg`/`rounded-xl` on cards), `font-display`/`font-sans`/`font-mono` roles, `border-foreground/10` borders, `animate-pulse bg-foreground/10` skeletons, and lucide-react icons only.

---

## Glossary

- **Builder**: The full-screen IDE at `/builder` where users chat with Claude AI to generate and deploy code.
- **Project**: A named, persisted unit of work containing a set of files, a chat history, and zero or more deployments. Stored in the `projects` Supabase table.
- **Project_Store**: The Supabase service responsible for reading and writing `projects` rows.
- **Chat_Store**: The Supabase service responsible for reading and writing `messages` rows.
- **Deployment_Store**: The Supabase service responsible for reading and writing `deployments` rows.
- **Vercel_Provisioner**: The server-side service that creates and manages per-user Vercel projects via the Vercel REST API.
- **Vercel_Project**: A Vercel project resource, identified by a `vercel_project_id`, scoped to one Masidy Project.
- **Stripe_Webhook_Handler**: The API route at `/api/webhooks/stripe` that processes Stripe events.
- **Credit_Ledger**: The Supabase `credits` and `credit_transactions` tables managed by `lib/credits.ts`.
- **Team**: A named workspace that groups users and projects under shared billing. Stored in the `teams` Supabase table.
- **Team_Member**: A user who belongs to a Team, with a role of `owner`, `admin`, or `member`. Stored in the `team_members` table.
- **Team_Invite**: A pending invitation to join a Team, identified by a token. Stored in the `team_invites` table.
- **AI_Gateway**: The proxy at `/api/gateway` that routes AI requests to multiple providers and bills credits.
- **Gateway_Key**: A user-scoped API key that authenticates requests to the AI_Gateway. Stored in the `gateway_keys` table.
- **Provider**: An external AI service — Anthropic, OpenAI, or Google Gemini.
- **Template**: A named starter project with pre-defined file content. Stored in the `templates` Supabase table or as static data.
- **Template_Marketplace**: The page at `/templates` listing all available Templates.
- **Credit_Pool**: The shared credit balance belonging to a Team, stored in the `team_credits` table.
- **RLS**: Row-Level Security policies in Supabase that restrict data access to the owning user or team.

---

## Requirements

### Requirement 1: Persistent Builder Projects

**User Story:** As a user, I want my builder projects to be saved automatically and accessible from a projects list, so that I never lose my work when I close or refresh the browser.

#### Acceptance Criteria

1. THE Project_Store SHALL persist each project as a row in the Supabase `projects` table with columns: `id` (UUID), `user_id` (UUID, foreign key to `auth.users`), `name` (text), `files` (JSONB array of `{path, content, language}`), `created_at` (timestamptz), `updated_at` (timestamptz).

2. WHEN a user sends a message in the Builder and the AI responds with files, THE Project_Store SHALL upsert the project row within 2 seconds of the AI response completing, updating `files` and `updated_at`.

3. WHEN a user opens the Builder without a `projectId` query parameter, THE Builder SHALL create a new project row in Supabase before the first AI message is sent, assigning it a generated name of the form `Untitled Project — {date}`.

4. WHEN a user opens the Builder with a `?projectId={id}` query parameter, THE Builder SHALL load the matching project's `files` and `messages` from Supabase and restore them into the editor and chat panel before the user can interact.

5. THE Dashboard SHALL provide a projects list page at `/dashboard/projects` that displays all projects owned by the authenticated user, sorted by `updated_at` descending.

6. WHEN the projects list page is loading data, THE Dashboard SHALL render `animate-pulse bg-foreground/10` skeleton blocks matching the project card layout.

7. WHEN a user clicks a project card on the projects list page, THE Dashboard SHALL navigate to `/builder?projectId={id}`.

8. WHEN a user activates the rename action on a project, THE Project_Store SHALL update the `name` column for that project row and THE Dashboard SHALL reflect the new name without a full page reload.

9. WHEN a user activates the delete action on a project and confirms the destructive action in a shadcn AlertDialog, THE Dashboard SHALL immediately remove the project card from the list optimistically, then THE Project_Store SHALL delete the project row and all associated `messages` rows for that project.

10. IF a project load fails because the row does not exist or the user does not own it, THEN THE Builder SHALL always display an explicit error state with a descriptive message and a button to create a new project; THE Builder SHALL NOT silently create a new project in place of the failed load.

11. THE Project_Store SHALL enforce Supabase RLS policies so that a user can only read, update, or delete their own project rows.

---

### Requirement 2: Per-User Vercel Project Isolation

**User Story:** As a user, I want each of my projects to deploy to its own dedicated Vercel project, so that my deployments are isolated from other users and I can see only my own deployment history.

#### Acceptance Criteria

1. WHEN a user triggers a deploy for a project that has no `vercel_project_id` stored, THE Vercel_Provisioner SHALL call the Vercel Projects API to create a new Vercel project named `masidy-{userId}-{projectId}` (truncated to 52 characters, lowercased, non-alphanumeric characters replaced with `-`).

2. WHEN the Vercel_Provisioner successfully creates a Vercel project, THE Project_Store SHALL store the returned Vercel project ID in the `vercel_project_id` column of the `projects` table row.

3. WHEN a user triggers a deploy for a project that already has a `vercel_project_id`, THE Vercel_Provisioner SHALL deploy to that existing Vercel project rather than creating a new one.

4. THE Deployment_Store SHALL associate each deployment record with the `project_id` of the Masidy project that triggered it, in addition to the existing `user_id` and `vercel_deployment_id` columns.

5. WHEN the deployments dashboard page at `/dashboard/deployments` loads, THE Dashboard SHALL display only deployment records where `user_id` matches the authenticated user's ID.

6. WHEN the deployments dashboard page loads data, THE Dashboard SHALL render `animate-pulse bg-foreground/10` skeleton rows matching the deployments table layout.

7. IF the Vercel Projects API returns an error during project creation, THEN THE Vercel_Provisioner SHALL immediately stop the deployment, return a user-friendly error message, and THE Builder SHALL display it in the terminal panel; any file upload that may have started SHALL be aborted.

8. THE Vercel_Provisioner SHALL use the platform's `VERCEL_ACCESS_TOKEN` and `VERCEL_TEAM_ID` environment variables for all Vercel API calls; it SHALL NOT use any per-user Vercel token for project creation.

---

### Requirement 3: Persistent Chat History

**User Story:** As a user, I want my builder chat messages to be saved to my account, so that I can review past conversations and resume work on a project from where I left off.

#### Acceptance Criteria

1. THE Chat_Store SHALL persist each chat message as a row in the Supabase `messages` table with columns: `id` (UUID), `user_id` (UUID), `project_id` (UUID, foreign key to `projects`), `role` (text, `user` or `assistant`), `content` (text), `files` (JSONB, nullable), `created_at` (timestamptz).

2. WHEN a user sends a message in the Builder, THE Chat_Store SHALL insert a row with `role = 'user'` and the message content before the AI API call is made.

3. WHEN the AI responds successfully, THE Chat_Store SHALL insert a row with `role = 'assistant'`, the explanation text as `content`, and the returned files array as `files`.

4. WHEN a user opens the Builder with a `?projectId={id}` query parameter, THE Builder SHALL fetch all `messages` rows for that project ordered by `created_at` ascending and render them in the chat panel before the user can interact.

5. THE Dashboard SHALL provide an Agent Sessions page at `/dashboard/agent/sessions` that lists all projects that have at least one message, grouped by project, showing the project name, message count, and the timestamp of the most recent message.

6. WHEN the Agent Sessions page is loading, THE Dashboard SHALL render `animate-pulse bg-foreground/10` skeleton rows.

7. WHEN a user clicks a session row on the Agent Sessions page, THE Dashboard SHALL navigate to `/builder?projectId={id}`.

8. THE Chat_Store SHALL enforce Supabase RLS policies so that a user can only read or insert message rows where `user_id` matches their own ID.

9. IF the Chat_Store insert fails for any message, THEN THE Builder SHALL log the error to the console and continue normal operation without surfacing the error to the user; IF the console logging call itself throws, THE Builder SHALL still continue normal operation.

---

### Requirement 4: Stripe Webhook Verification

**User Story:** As a platform operator, I want the Stripe webhook handler to be fully verified end-to-end, so that credits are reliably added after successful payments and failed payments are handled gracefully.

#### Acceptance Criteria

1. WHEN the Stripe_Webhook_Handler receives a POST request, THE Stripe_Webhook_Handler SHALL call `stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)` using the raw request body (not parsed JSON) to verify the signature.

2. IF the signature verification throws an error, THEN THE Stripe_Webhook_Handler SHALL return HTTP 400 with body `{"error": "Invalid signature"}` and SHALL NOT process the event.

3. WHEN the Stripe_Webhook_Handler receives a verified `checkout.session.completed` event, THE Stripe_Webhook_Handler SHALL extract `session.metadata.user_id` and `session.metadata.credits`, call `addCredits(user_id, parseInt(credits), description)`, and return HTTP 200 with body `{"received": true}`.

4. IF `session.metadata.user_id` or `session.metadata.credits` is missing or non-numeric in a `checkout.session.completed` event, THEN THE Stripe_Webhook_Handler SHALL log the malformed event and return HTTP 200 without modifying the Credit_Ledger.

5. WHEN the Stripe_Webhook_Handler receives a verified `payment_intent.payment_failed` event, THE Stripe_Webhook_Handler SHALL insert a row into the Supabase `notifications` table (columns: `user_id`, `type`, `message`, `created_at`) with `type = 'payment_failed'` and a descriptive message, if the `notifications` table exists.

6. THE Stripe_Webhook_Handler SHALL handle `checkout.session.completed` and `payment_intent.payment_failed` event types; all other event types SHALL return HTTP 200 with body `{"received": true}` without further processing.

7. THE platform documentation SHALL include instructions for registering the webhook endpoint URL `{NEXT_PUBLIC_APP_URL}/api/webhooks/stripe` in the Stripe Dashboard with the events `checkout.session.completed` and `payment_intent.payment_failed`.

8. WHEN the `addCredits` call throws an exception inside the webhook handler, THE Stripe_Webhook_Handler SHALL catch the exception, log it, and return HTTP 500 so that Stripe retries the event.

---

### Requirement 5: Team / Workspace Support

**User Story:** As a user, I want to create a team workspace, invite colleagues by email, and share projects and credits with them, so that my team can collaborate on builds without managing separate accounts.

#### Acceptance Criteria

1. THE Project_Store SHALL support a `team_id` (UUID, nullable, foreign key to `teams`) column on the `projects` table; a project with a non-null `team_id` is a team project visible to all members of that team.

2. THE platform SHALL provide a Supabase `teams` table with columns: `id` (UUID), `name` (text), `owner_id` (UUID, foreign key to `auth.users`), `created_at` (timestamptz).

3. THE platform SHALL provide a Supabase `team_members` table with columns: `id` (UUID), `team_id` (UUID), `user_id` (UUID), `role` (text: `owner`, `admin`, or `member`), `joined_at` (timestamptz).

4. THE platform SHALL provide a Supabase `team_invites` table with columns: `id` (UUID), `team_id` (UUID), `email` (text), `token` (text, unique), `invited_by` (UUID), `accepted_at` (timestamptz, nullable), `created_at` (timestamptz).

5. WHEN a user submits the Create Team form on the team settings page, THE platform SHALL insert a row into `teams` and a row into `team_members` with `role = 'owner'` for the creating user, then redirect to `/dashboard/settings/team`.

6. WHEN a team owner or admin submits the Invite Member form with a valid email address, THE platform SHALL insert a row into `team_invites` with a cryptographically random token and send an invitation email containing the accept URL `{APP_URL}/team/accept?token={token}`; the invitation email SHALL be sent regardless of whether the database insert succeeded.

7. WHEN a recipient visits the accept URL with a valid, unaccepted token, THE platform SHALL insert a row into `team_members` with `role = 'member'`, set `accepted_at` on the invite row, and redirect the user to `/dashboard`.

8. IF the accept URL token is invalid or already accepted, THEN THE platform SHALL display an error page with a message and a link to the dashboard.

9. THE Dashboard SHALL provide a team settings page at `/dashboard/settings/team` that displays the team name, a list of members with their roles, a form to invite new members by email, and a button to leave or delete the team.

10. WHEN the team settings page loads, THE Dashboard SHALL render `animate-pulse bg-foreground/10` skeleton rows for the members list.

11. THE platform SHALL provide a Supabase `team_credits` table with columns: `team_id` (UUID, primary key), `balance` (numeric), `updated_at` (timestamptz) to hold the shared credit pool.

12. WHEN a team project triggers an AI message or deploy, THE Credit_Ledger SHALL deduct credits from the `team_credits` balance for that team rather than from the individual user's `credits` balance; the `team_credits` balance MAY go negative and the negative balance SHALL be handled separately (e.g. surfaced in the team billing page).

13. IF the `team_credits` balance is zero or negative before an action, THEN THE platform SHALL return HTTP 402 with `{"error": "Insufficient team credits"}` and SHALL NOT deduct from the individual user's balance.

14. THE platform SHALL enforce Supabase RLS policies so that team project rows are readable by all `team_members` of the associated team and writable only by `owner` or `admin` role members.

15. WHEN a team owner activates the delete team action and confirms in a shadcn AlertDialog, THE platform SHALL delete the `teams` row, all `team_members` rows, all `team_invites` rows, and set `team_id = null` on all associated project rows.

---

### Requirement 6: Real AI Gateway (Multi-Provider Proxy)

**User Story:** As a developer, I want to use a single API endpoint that routes to multiple AI providers and bills my Masidy credits, so that I can integrate AI into my own apps without managing multiple provider keys.

#### Acceptance Criteria

1. THE AI_Gateway SHALL expose a POST endpoint at `/api/gateway` that accepts a JSON body with fields: `provider` (string: `anthropic`, `openai`, or `gemini`), `model` (string), `messages` (array), and `stream` (boolean, optional).

2. WHEN a request arrives at `/api/gateway`, THE AI_Gateway SHALL authenticate the request by reading the `Authorization: Bearer {key}` header and looking up the key in the `gateway_keys` table.

3. IF the `Authorization` header is missing or the key does not exist in `gateway_keys`, THEN THE AI_Gateway SHALL return HTTP 401 with `{"error": "Invalid API key"}`.

4. WHEN a valid Gateway_Key is presented, THE AI_Gateway SHALL deduct credits from the key owner's Credit_Ledger using the same `deductCredits` function used by the builder, with the action mapped to the requested model tier.

5. IF the key owner's credit balance is insufficient, THEN THE AI_Gateway SHALL return HTTP 402 with `{"error": "Insufficient credits", "remaining": {balance}}`.

6. WHEN the credit deduction succeeds, THE AI_Gateway SHALL forward the request to the appropriate Provider API using the platform's server-side provider keys (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`) and return the provider's response to the caller.

7. IF the Provider API returns an error, THEN THE AI_Gateway SHALL return HTTP 502 with `{"error": "Provider error", "provider": "{provider}", "status": {status}}`.

8. THE platform SHALL provide a Supabase `gateway_keys` table with columns: `id` (UUID), `user_id` (UUID), `name` (text), `key_hash` (text, unique — store bcrypt hash, never plaintext), `created_at` (timestamptz), `last_used_at` (timestamptz, nullable), `revoked_at` (timestamptz, nullable).

9. WHEN a user creates a new Gateway_Key via the AI Gateway dashboard, THE platform SHALL generate a cryptographically random key with prefix `msk_`, display it once in a modal, store only the bcrypt hash in `gateway_keys`, and never display the plaintext key again.

10. WHEN a user revokes a Gateway_Key, THE platform SHALL set `revoked_at` to the current timestamp; THE AI_Gateway SHALL reject requests using revoked keys with HTTP 401.

11. THE AI_Gateway SHALL enforce a per-key rate limit of 60 requests per minute; IF the limit is exceeded, THEN THE AI_Gateway SHALL return HTTP 429 with `{"error": "Rate limit exceeded"}` and a `Retry-After` header.

12. THE platform SHALL record each gateway request as a row in the `gateway_usage` table with columns: `id` (UUID), `key_id` (UUID), `user_id` (UUID), `provider` (text), `model` (text), `credits_used` (numeric), `status` (text: `success`, `auth_error`, `credit_error`, `rate_limited`, `provider_error`), `created_at` (timestamptz); THE AI_Gateway SHALL insert this row for all requests regardless of outcome.

13. THE AI Gateway dashboard page at `/dashboard/ai-gateway` SHALL display: current credit balance, a list of Gateway_Keys with name, creation date, last-used date, and a revoke button, a Create Key button, and a usage analytics table showing requests grouped by provider and model.

14. WHEN the AI Gateway dashboard page loads, THE Dashboard SHALL render `animate-pulse bg-foreground/10` skeleton blocks for the keys list and usage table.

---

### Requirement 7: Template Marketplace

**User Story:** As a new user, I want to choose from a gallery of real starter templates that pre-populate the builder with working code, so that I can start building immediately without writing boilerplate.

#### Acceptance Criteria

1. THE platform SHALL provide at least six named templates: `blank`, `landing-page`, `saas-dashboard`, `rest-api`, `blog`, and `ecommerce`, each with a complete set of files sufficient to produce a deployable Next.js 14 App Router project.

2. WHEN a user selects a template on the onboarding page (step 3) and completes onboarding, THE Builder SHALL open with the selected template's files pre-loaded into the editor and file tree, and a new project row created in Supabase with those files.

3. THE platform SHALL provide a Template Marketplace page at `/templates` that displays all available templates as cards showing: template name, a one-line description, a technology badge (e.g. `Next.js`, `Tailwind`), and a "Use template" button.

4. WHEN the Template Marketplace page loads, THE Dashboard SHALL render `animate-pulse bg-foreground/10` skeleton cards matching the template card layout.

5. WHEN a user clicks "Use template" on the Template Marketplace page, THE platform SHALL create a new project row in Supabase pre-populated with the template's files and navigate to `/builder?projectId={newId}`.

6. THE `landing-page` template SHALL include at minimum: `app/page.tsx` (hero section, features section, CTA), `app/layout.tsx`, `app/globals.css` with Tailwind directives, and `package.json`.

7. THE `saas-dashboard` template SHALL include at minimum: `app/page.tsx` (dashboard overview), `app/layout.tsx` with a sidebar component, `components/sidebar.tsx`, `app/globals.css`, and `package.json`.

8. THE `rest-api` template SHALL include at minimum: `app/api/hello/route.ts`, `app/api/items/route.ts` (GET/POST), `app/page.tsx` (API documentation page), `app/layout.tsx`, and `package.json`.

9. THE `blog` template SHALL include at minimum: `app/page.tsx` (post list), `app/posts/[slug]/page.tsx` (post detail), `lib/posts.ts` (static post data), `app/layout.tsx`, and `package.json`.

10. THE `ecommerce` template SHALL include at minimum: `app/page.tsx` (product grid), `app/products/[id]/page.tsx` (product detail), `app/cart/page.tsx` (cart), `lib/products.ts` (static product data), `app/layout.tsx`, and `package.json`.

11. THE Template Marketplace page SHALL be accessible without authentication so that prospective users can browse templates before signing up.

12. WHEN an unauthenticated user clicks "Use template", THE platform SHALL redirect to `/auth/signup?template={templateId}` and, after successful signup and onboarding, pre-load the selected template into the first project.

---

### Requirement 8: Mobile Experience

**User Story:** As a user on a mobile device, I want the dashboard and builder to be usable on a small screen, so that I can manage my projects and chat with the AI from my phone.

#### Acceptance Criteria

1. WHILE the viewport width is less than 768px, THE Dashboard SHALL replace the left sidebar with a bottom navigation bar containing icons and labels for: Home, Projects, Builder, Billing, and Profile.

2. WHILE the viewport width is less than 768px, THE Dashboard SHALL hide the sidebar entirely and render the bottom navigation bar with `position: fixed; bottom: 0; left: 0; right: 0` using `bg-background border-t border-foreground/10`.

3. WHILE the viewport width is less than 768px, THE Builder SHALL display only the chat panel; the code editor, file tree, and preview iframe SHALL be hidden.

4. WHILE the viewport width is less than 768px and the Builder is in chat-only mode, THE Builder SHALL display a "View code" button in the top bar; WHEN the user taps "View code", THE Builder SHALL open a bottom sheet showing the file tree and code editor.

5. WHILE the viewport width is less than 768px, THE Builder top bar SHALL collapse the project name and branch selector into a single tap target showing only the project name.

6. WHEN a user on a mobile device deploys from the Builder, THE Builder SHALL show the deploy status and live URL in the chat panel as an assistant message rather than in the terminal panel.

7. THE dashboard pages for Projects, Deployments, Billing, and Profile SHALL use single-column layouts on viewports narrower than 768px, replacing multi-column grids with stacked cards.

8. THE Template Marketplace page SHALL use a single-column card layout on viewports narrower than 768px.

9. WHILE the viewport width is less than 768px, THE Builder chat input SHALL remain fixed at the bottom of the screen above the bottom navigation bar, with a minimum tap target height of 44px for the send button.

10. THE platform SHALL not introduce any horizontal scroll on any page at viewport widths of 375px or wider.

11. WHILE the viewport width is between 768px and 1024px (tablet), THE Dashboard sidebar SHALL render in a collapsed icon-only mode by default, expanding to full width on user interaction.
