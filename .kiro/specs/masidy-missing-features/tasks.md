# Implementation Plan: Masidy Missing Features

## Overview

Implement all eight missing feature areas: persistent builder projects, per-user Vercel isolation, persistent chat history, Stripe webhook verification, team/workspace support, real AI gateway, template marketplace, and mobile experience. All UI follows the Masidy design system.

## Tasks

- [ ] 1. Create database migration SQL file with all new tables and RLS policies
  - Create `supabase/migrations/001_missing_features.sql` with: projects, messages, teams, team_members, team_invites, team_credits, gateway_keys, gateway_usage, notifications tables
  - Add all indexes and RLS policies as specified in design.md
  - Add `project_id` column to existing `deployments` table
  - Include SQL comment block at top with instructions for running in Supabase SQL editor

- [ ] 2. Create `lib/projects.ts` service module
  - Implement `ProjectFile` type and `Project` interface
  - Implement `createProject(userId, name, files?)` — inserts row, returns project
  - Implement `upsertProjectFiles(projectId, files)` — updates files + updated_at
  - Implement `getProject(projectId)` — returns project or null
  - Implement `listProjects(userId)` — sorted by updated_at DESC
  - Implement `renameProject(projectId, name)`
  - Implement `deleteProject(projectId)` — deletes project and all messages
  - Implement `setVercelProjectId(projectId, vercelProjectId)`
  - Use `createAdminClient()` for all writes, validate ownership in reads

- [ ] 3. Create `lib/messages.ts` service module
  - Implement `Message` interface and `MessageRole` type
  - Implement `insertUserMessage(userId, projectId, content)` — fire-and-forget safe
  - Implement `insertAssistantMessage(userId, projectId, content, files)` — fire-and-forget safe
  - Implement `getProjectMessages(projectId)` — ordered by created_at ASC
  - Implement `listSessionProjects(userId)` — GROUP BY query returning project_id, name, count, last_message_at
  - Wrap all inserts in try/catch, log errors, never throw

- [ ] 4. Create `lib/teams.ts` service module
  - Implement `Team`, `TeamMember`, `TeamInvite` interfaces
  - Implement `createTeam(userId, name)` — inserts team + owner member + team_credits row
  - Implement `getTeamForUser(userId)` — returns team or null
  - Implement `getTeamMembers(teamId)` — returns members array
  - Implement `inviteMember(teamId, email, invitedBy)` — generates crypto token, inserts invite
  - Implement `acceptInvite(token, userId)` — inserts member, sets accepted_at
  - Implement `deleteTeam(teamId)` — deletes team (cascade handles rest)
  - Implement `getTeamCredits(teamId)` — returns balance
  - Implement `deductTeamCredits(teamId, action, description)` — deducts from team_credits

- [ ] 5. Create `lib/gateway.ts` service module
  - Implement `GatewayKey`, `GatewayProvider`, `GatewayStatus` types
  - Implement `createGatewayKey(userId, name)` — generates `msk_` key, bcrypt hash, stores key_prefix (first 8 chars), returns plaintext once
  - Implement `validateGatewayKey(plaintext)` — prefix lookup then bcrypt compare, returns key or null
  - Implement `revokeGatewayKey(keyId, userId)` — sets revoked_at
  - Implement `listGatewayKeys(userId)` — never returns key_hash
  - Implement `recordGatewayUsage(params)` — inserts usage row, wrapped in try/catch
  - Implement `getGatewayUsageSummary(userId)` — grouped by provider/model
  - Install `bcryptjs` package

- [ ] 6. Create `lib/templates.ts` with all 6 starter templates
  - Implement `Template` and `TemplateFile` interfaces
  - Implement `blank` template — minimal Next.js 14 App Router project (app/page.tsx, app/layout.tsx, app/globals.css, package.json)
  - Implement `landing-page` template — hero, features, CTA sections with Tailwind
  - Implement `saas-dashboard` template — dashboard layout with sidebar component
  - Implement `rest-api` template — API routes with documentation page
  - Implement `blog` template — post list, post detail, static post data
  - Implement `ecommerce` template — product grid, product detail, cart, static product data
  - Implement `getTemplate(id)` helper
  - Export `TEMPLATES` array

- [ ] 7. Extend `lib/credits.ts` to support team credit deduction
  - Add optional `teamId` parameter to `deductCredits` function signature
  - When `teamId` is provided, deduct from `team_credits` table instead of `credits`
  - Return HTTP 402 when team balance is zero or negative
  - Keep existing individual user deduction path unchanged

- [ ] 8. Create projects API routes
  - Create `app/api/projects/route.ts` — GET (list user projects), POST (create project, optionally from templateId)
  - Create `app/api/projects/[id]/route.ts` — GET (get project), PATCH (rename), DELETE (delete + messages)
  - Create `app/api/projects/[id]/messages/route.ts` — GET (list messages for project)
  - All routes require Supabase auth, return 401 if unauthenticated
  - Depends on: 2, 3

- [ ] 9. Fix Stripe webhook handler end-to-end
  - Update `app/api/webhooks/stripe/route.ts` to read raw body with `req.text()` (not `req.json()`)
  - Verify `stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)` — return 400 on failure
  - Handle `checkout.session.completed` — validate metadata.user_id and metadata.credits, call `addCredits`, catch exception → return 500
  - Handle `payment_intent.payment_failed` — insert row into notifications table
  - Add explicit default case returning `{ received: true }` for all other event types
  - Add `STRIPE_WEBHOOK_SECRET` to `.env.example`

- [ ] 10. Create teams API routes
  - Create `app/api/teams/route.ts` — POST (create team)
  - Create `app/api/teams/[id]/route.ts` — GET (team + members), DELETE (owner only)
  - Create `app/api/teams/[id]/invite/route.ts` — POST (invite by email, send invite email)
  - Create `app/api/teams/[id]/members/[uid]/route.ts` — DELETE (remove member)
  - Create `app/api/team/accept/route.ts` — POST (accept invite by token)
  - Depends on: 4

- [ ] 11. Create AI gateway API routes
  - Create `app/api/gateway/route.ts` — POST proxy endpoint (auth, rate limit, credit deduct, forward to provider, record usage)
  - Create `app/api/gateway/keys/route.ts` — GET (list keys), POST (create key, return plaintext once)
  - Create `app/api/gateway/keys/[id]/route.ts` — DELETE (revoke key)
  - Create `app/api/gateway/usage/route.ts` — GET (usage summary)
  - Add `OPENAI_API_KEY` and `GEMINI_API_KEY` to `.env.example`
  - Depends on: 5, 7

- [ ] 12. Update builder deploy API for per-user Vercel project isolation
  - Update `app/api/builder/deploy/route.ts` to accept `projectId` and `vercelProjectId` in request body
  - If `vercelProjectId` is absent, call Vercel Projects API to create new project named `masidy-{userId}-{projectId}` (≤52 chars, lowercase, alphanumeric+dash)
  - On successful project creation, call `setVercelProjectId(projectId, newVercelProjectId)`
  - Pass `projectId` when inserting deployment record
  - Return `vercelProjectId` in response
  - If Vercel project creation fails, return user-friendly error immediately
  - Depends on: 2

- [ ] 13. Update builder chat API to persist messages
  - Update `app/api/builder/chat/route.ts` to accept `projectId` in request body
  - Before AI call: `void insertUserMessage(userId, projectId, content)` (fire-and-forget)
  - After successful AI response: `void insertAssistantMessage(userId, projectId, explanation, files)` (fire-and-forget)
  - If `projectId` is absent, skip persistence silently
  - Depends on: 3

- [ ] 14. Update builder page for project persistence
  - Update `app/builder/page.tsx` to read `?projectId` from search params
  - On mount without projectId: call `POST /api/projects` to create new project, redirect to `/builder?projectId={id}`
  - On mount with projectId: fetch project files and messages, restore into editor and chat panel
  - On project load failure (null/404): show explicit error state with "Create new project" button — never silently create a replacement
  - After every AI response: call `PATCH /api/projects/{id}` to upsert files
  - Pass `projectId` to chat and deploy API calls
  - Depends on: 8, 13

- [ ] 15. Create `/dashboard/projects` projects list page
  - Create `app/dashboard/projects/page.tsx` — fetches and displays all user projects
  - Show project cards with: name, last updated time, file count, "Open in Builder" link
  - Inline rename: click name → input field, blur/Enter commits via PATCH
  - Delete button opens shadcn AlertDialog, calls DELETE on confirm, optimistic removal
  - Loading skeleton: `animate-pulse bg-foreground/10` cards matching layout
  - Empty state with "Create your first project" button linking to `/builder`
  - Add "Projects" link to sidebar navItems in `components/dashboard/app-sidebar.tsx`
  - Depends on: 8

- [ ] 16. Update Agent Sessions page to show real data
  - Update `app/dashboard/agent/sessions/page.tsx` to call `GET /api/projects/{id}/messages` via `listSessionProjects`
  - Show sessions grouped by project: project name, message count, last message timestamp
  - Clicking a session navigates to `/builder?projectId={id}`
  - Loading skeleton: 5 rows of `animate-pulse bg-foreground/10`
  - Depends on: 3, 8

- [ ] 17. Create team settings page
  - Create `app/dashboard/settings/team/page.tsx`
  - Show team name, members list with role badges, invite form (email input + Send button)
  - "Create Team" form if user has no team
  - Leave team button (non-owner), Delete team button (owner only) with AlertDialog
  - Loading skeleton for members list
  - Depends on: 10

- [ ] 18. Create team invite acceptance page
  - Create `app/team/accept/page.tsx` — reads `?token` from URL
  - Calls `POST /api/team/accept { token }` on mount
  - Shows success state with redirect to dashboard, or error state with link to dashboard
  - Depends on: 10

- [ ] 19. Update AI Gateway dashboard page
  - Update `app/dashboard/ai-gateway/page.tsx` to show: credit balance, gateway keys list, create key button, usage table
  - "Create Key" button opens a modal showing the plaintext key once (copy button, warning it won't be shown again)
  - Each key row shows: name, created date, last used date, revoke button
  - Revoke opens AlertDialog confirmation
  - Usage table: provider, model, total requests, total credits
  - Loading skeletons for keys list and usage table
  - Depends on: 11

- [ ] 20. Create Template Marketplace page
  - Create `app/templates/page.tsx` — public page (no auth required), Server Component
  - Render template cards from `TEMPLATES` static data: name, description, badge, "Use template" button
  - "Use template" button: if authenticated → `POST /api/projects { templateId }` → navigate to builder; if not → redirect to `/auth/signup?template={id}`
  - Loading skeleton: 6 card skeletons
  - Add link to templates page in landing page navigation
  - Depends on: 6, 8

- [ ] 21. Update onboarding to use real template files
  - Update `app/onboarding/page.tsx` step 3 to store selected `templateId` in state
  - On onboarding completion: call `POST /api/projects { templateId }` to create project with template files
  - Navigate to `/builder?projectId={id}` instead of `/dashboard`
  - Depends on: 6, 8

- [ ] 22. Implement mobile bottom navigation bar
  - Create `components/dashboard/bottom-nav.tsx` — fixed bottom bar, `bg-background border-t border-foreground/10`
  - Icons: Home (`/dashboard`), FolderOpen (`/dashboard/projects`), Hammer (`/builder`), CreditCard (`/dashboard/billing`), User (`/dashboard/profile`)
  - Active state: `text-foreground`; inactive: `text-muted-foreground`
  - Labels: `text-[10px] font-mono` below each icon
  - Use `usePathname()` for active detection
  - Update `app/dashboard/layout.tsx` to render `<BottomNav />` below content on mobile (`md:hidden`), hide `<AppSidebar />` on mobile (`hidden md:flex`)

- [ ] 23. Implement mobile builder (chat-only mode)
  - Update `app/builder/page.tsx` to hide code editor, file tree, and preview iframe on mobile (`md:hidden`)
  - Show "View code" button in top bar on mobile only (`md:hidden`)
  - Create `components/builder/code-bottom-sheet.tsx` — fixed bottom sheet with file tree + code editor, triggered by "View code" button
  - On mobile deploy success: inject live URL as assistant message in chat panel instead of terminal
  - Fix chat input: `fixed bottom-14 left-0 right-0` on mobile (above bottom nav), send button `min-h-[44px] min-w-[44px]`
  - Depends on: 22

- [ ] 24. Make dashboard pages responsive (single-column on mobile)
  - Update `app/dashboard/page.tsx` — replace 3-column grid with single-column stack on mobile
  - Update `app/dashboard/billing/page.tsx` — single-column credit packs on mobile
  - Update `app/dashboard/profile/page.tsx` — full-width form on mobile
  - Update `app/dashboard/deployments/page.tsx` — horizontal scroll wrapper on mobile for table
  - Add `overflow-x-hidden` to root containers, `overflow-x-auto` wrappers for tables
  - Ensure no horizontal scroll at 375px viewport width

- [ ] 25. Make tablet sidebar icon-only by default
  - Update `app/dashboard/layout.tsx` to pass `defaultOpen={false}` to `SidebarProvider` on tablet (768px–1024px)
  - The existing shadcn `SidebarTrigger` + `collapsible="icon"` already handles icon-only mode
  - Verify sidebar expands on click and collapses back correctly

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": [1, 2, 3, 4, 5, 6]
    },
    {
      "wave": 2,
      "tasks": [7, 8, 9, 10, 11]
    },
    {
      "wave": 3,
      "tasks": [12, 13, 14, 20, 22, 25]
    },
    {
      "wave": 4,
      "tasks": [15, 16, 17, 18, 19, 21, 23, 24]
    }
  ]
}
```

## Notes

- All new tables must have RLS enabled before any data is written. Run the migration SQL in Supabase SQL editor before deploying.
- `bcryptjs` must be installed: `npm install bcryptjs @types/bcryptjs`
- `OPENAI_API_KEY` and `GEMINI_API_KEY` are optional — the gateway returns a 503 if the requested provider key is not configured.
- `STRIPE_WEBHOOK_SECRET` must be set in production. Get it from the Stripe Dashboard → Webhooks → your endpoint → Signing secret.
- Templates are static TypeScript data — no Supabase table needed. They are version-controlled in `lib/templates.ts`.
- All design system rules apply: `bg-background`, sharp corners (no `rounded-lg`/`rounded-xl` on cards), `font-display`/`font-sans`/`font-mono`, `border-foreground/10`, `animate-pulse bg-foreground/10` skeletons, lucide-react icons only.
- Fire-and-forget message inserts in the builder must never block the AI response. Always use `void fn()` pattern with internal try/catch.
