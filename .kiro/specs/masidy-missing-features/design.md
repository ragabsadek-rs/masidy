# Design Document — Masidy Missing Features

## Overview

This document covers the technical design for eight feature areas that complete the Masidy platform: Persistent Builder Projects, Per-User Vercel Project Isolation, Persistent Chat History, Stripe Webhook Verification, Team/Workspace Support, Real AI Gateway, Template Marketplace, and Mobile Experience.

All UI follows the Masidy design system: `bg-background`, sharp corners (no `rounded-lg`/`rounded-xl` on cards), `font-display`/`font-sans`/`font-mono` roles, `border-foreground/10` borders, `animate-pulse bg-foreground/10` skeletons, and lucide-react icons only.

**Tech stack:** Next.js 14 App Router, TypeScript, Tailwind CSS v4, Supabase (auth + DB), Vercel API, Anthropic Claude, Stripe.

---

## Architecture

The platform follows a layered architecture:

```
┌─────────────────────────────────────────────────────────────┐
│  Next.js App Router (app/)                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Pages/UI    │  │  API Routes  │  │  Server Actions  │  │
│  │  (Client)    │  │  (Server)    │  │  (Server)        │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
│         │                 │                    │            │
│  ┌──────▼─────────────────▼────────────────────▼─────────┐  │
│  │  Service Layer (lib/)                                  │  │
│  │  credits.ts │ vercel.ts │ stripe.ts │ ratelimit.ts    │  │
│  │  projects.ts (new) │ messages.ts (new) │ teams.ts (new)│  │
│  │  gateway.ts (new) │ templates.ts (new)                 │  │
│  └──────────────────────────┬─────────────────────────────┘  │
│                             │                               │
│  ┌──────────────────────────▼─────────────────────────────┐  │
│  │  Data Layer                                            │  │
│  │  Supabase (PostgreSQL + RLS) │ Vercel API              │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Admin client for writes, user client for reads** — All mutations use `createAdminClient()` (service role, bypasses RLS) inside API routes. Client components use `createClient()` (anon key, respects RLS) for reads. This matches the existing pattern in `lib/credits.ts`.

2. **Optimistic UI** — Project deletion and rename update local state immediately before the server confirms, matching the existing dashboard pattern.

3. **No new icon libraries** — All icons use lucide-react exclusively.

4. **Gateway key hashing** — bcrypt via the `bcryptjs` npm package (pure JS, no native deps, works in Edge runtime).

5. **Template storage** — Templates are stored as static TypeScript data in `lib/templates.ts` (not in Supabase) to avoid DB round-trips on the public marketplace page and to keep them version-controlled.

6. **Mobile layout** — Uses Tailwind responsive prefixes (`md:`) throughout. The bottom nav is a new component rendered inside the dashboard layout, conditionally replacing the sidebar on small screens.

---

## Components and Interfaces

### New Service Modules (`lib/`)

#### `lib/projects.ts`

```typescript
// ProjectFile type used across the platform
export type ProjectFile = { path: string; content: string; language: string };

// Project row shape
export interface Project {
  id: string;
  user_id: string;
  team_id: string | null;
  name: string;
  files: ProjectFile[];
  vercel_project_id: string | null;
  created_at: string;
  updated_at: string;
}

// Create a new project row; returns the created project
export async function createProject(userId: string, name: string, files?: ProjectFile[]): Promise<Project>

// Upsert project files (called after every AI response)
export async function upsertProjectFiles(projectId: string, files: ProjectFile[]): Promise<void>

// Load a project by ID (validates ownership via RLS)
export async function getProject(projectId: string): Promise<Project | null>

// List all projects for a user, sorted by updated_at desc
export async function listProjects(userId: string): Promise<Project[]>

// Rename a project
export async function renameProject(projectId: string, name: string): Promise<void>

// Delete a project and all its messages
export async function deleteProject(projectId: string): Promise<void>

// Store vercel_project_id after provisioning
export async function setVercelProjectId(projectId: string, vercelProjectId: string): Promise<void>
```

#### `lib/messages.ts`

```typescript
export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  user_id: string;
  project_id: string;
  role: MessageRole;
  content: string;
  files: ProjectFile[] | null;
  created_at: string;
}

// Insert a user message before the AI call
export async function insertUserMessage(userId: string, projectId: string, content: string): Promise<void>

// Insert an assistant message after AI responds
export async function insertAssistantMessage(
  userId: string, projectId: string, content: string, files: ProjectFile[]
): Promise<void>

// Load all messages for a project, ordered by created_at asc
export async function getProjectMessages(projectId: string): Promise<Message[]>

// List projects that have at least one message (for Agent Sessions page)
export async function listSessionProjects(userId: string): Promise<{
  project_id: string; project_name: string; message_count: number; last_message_at: string;
}[]>
```

#### `lib/teams.ts`

```typescript
export interface Team { id: string; name: string; owner_id: string; created_at: string; }
export interface TeamMember { id: string; team_id: string; user_id: string; role: 'owner'|'admin'|'member'; joined_at: string; }
export interface TeamInvite { id: string; team_id: string; email: string; token: string; invited_by: string; accepted_at: string|null; created_at: string; }

export async function createTeam(userId: string, name: string): Promise<Team>
export async function getTeamForUser(userId: string): Promise<Team | null>
export async function getTeamMembers(teamId: string): Promise<TeamMember[]>
export async function inviteMember(teamId: string, email: string, invitedBy: string): Promise<TeamInvite>
export async function acceptInvite(token: string, userId: string): Promise<void>
export async function deleteTeam(teamId: string): Promise<void>
export async function getTeamCredits(teamId: string): Promise<number>
export async function deductTeamCredits(teamId: string, action: CreditAction, description: string): Promise<{ success: boolean; remaining: number }>
```

#### `lib/gateway.ts`

```typescript
export interface GatewayKey {
  id: string; user_id: string; name: string; key_hash: string;
  created_at: string; last_used_at: string | null; revoked_at: string | null;
}

export type GatewayProvider = 'anthropic' | 'openai' | 'gemini';
export type GatewayStatus = 'success' | 'auth_error' | 'credit_error' | 'rate_limited' | 'provider_error';

// Generate a new msk_ prefixed key, store bcrypt hash, return plaintext once
export async function createGatewayKey(userId: string, name: string): Promise<{ key: string; record: GatewayKey }>

// Validate a key from Authorization header; returns key record or null
export async function validateGatewayKey(plaintext: string): Promise<GatewayKey | null>

// Revoke a key by setting revoked_at
export async function revokeGatewayKey(keyId: string, userId: string): Promise<void>

// List keys for a user (never returns key_hash)
export async function listGatewayKeys(userId: string): Promise<Omit<GatewayKey, 'key_hash'>[]>

// Record a usage row
export async function recordGatewayUsage(params: {
  keyId: string; userId: string; provider: GatewayProvider;
  model: string; creditsUsed: number; status: GatewayStatus;
}): Promise<void>

// Get usage grouped by provider/model for dashboard
export async function getGatewayUsageSummary(userId: string): Promise<{
  provider: string; model: string; total_requests: number; total_credits: number;
}[]>
```

#### `lib/templates.ts`

```typescript
export interface TemplateFile { path: string; content: string; language: string; }
export interface Template {
  id: string; name: string; description: string; badge: string; files: TemplateFile[];
}

// Static registry — no DB round-trip
export const TEMPLATES: Template[] = [
  { id: 'blank', name: 'Blank', description: 'Empty Next.js 14 App Router project', badge: 'Next.js', files: [...] },
  { id: 'landing-page', name: 'Landing Page', description: 'Hero, features, and CTA sections', badge: 'Next.js + Tailwind', files: [...] },
  { id: 'saas-dashboard', name: 'SaaS Dashboard', description: 'Dashboard layout with sidebar', badge: 'Next.js + Tailwind', files: [...] },
  { id: 'rest-api', name: 'REST API', description: 'API routes with documentation page', badge: 'Next.js API', files: [...] },
  { id: 'blog', name: 'Blog', description: 'Post list and detail pages', badge: 'Next.js + MDX', files: [...] },
  { id: 'ecommerce', name: 'E-commerce', description: 'Product grid, detail, and cart', badge: 'Next.js + Tailwind', files: [...] },
];

export function getTemplate(id: string): Template | undefined
```

### New API Routes

| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/projects` | GET | User session | List user's projects |
| `/api/projects` | POST | User session | Create new project |
| `/api/projects/[id]` | GET | User session | Get project by ID |
| `/api/projects/[id]` | PATCH | User session | Rename project |
| `/api/projects/[id]` | DELETE | User session | Delete project + messages |
| `/api/projects/[id]/messages` | GET | User session | Get project messages |
| `/api/teams` | POST | User session | Create team |
| `/api/teams/[id]` | GET | User session | Get team + members |
| `/api/teams/[id]` | DELETE | User session | Delete team (owner only) |
| `/api/teams/[id]/invite` | POST | User session | Invite member by email |
| `/api/teams/[id]/members/[uid]` | DELETE | User session | Remove member |
| `/api/team/accept` | POST | Public | Accept invite by token |
| `/api/gateway` | POST | Gateway key | AI proxy endpoint |
| `/api/gateway/keys` | GET | User session | List gateway keys |
| `/api/gateway/keys` | POST | User session | Create gateway key |
| `/api/gateway/keys/[id]` | DELETE | User session | Revoke gateway key |
| `/api/gateway/usage` | GET | User session | Usage summary |

### New Dashboard Pages

| Route | Component | Description |
|---|---|---|
| `/dashboard/projects` | `ProjectsPage` | Project list with cards |
| `/dashboard/agent/sessions` | `AgentSessionsPage` | Chat session list |
| `/dashboard/settings/team` | `TeamSettingsPage` | Team management |
| `/dashboard/ai-gateway` | `AIGatewayPage` | Gateway keys + usage |
| `/templates` | `TemplatesPage` | Public template marketplace |
| `/team/accept` | `AcceptInvitePage` | Invite acceptance flow |

### New UI Components

| Component | Path | Description |
|---|---|---|
| `ProjectCard` | `components/dashboard/project-card.tsx` | Project list item with rename/delete actions |
| `ProjectCardSkeleton` | `components/dashboard/project-card.tsx` | Skeleton variant |
| `BottomNav` | `components/dashboard/bottom-nav.tsx` | Mobile bottom navigation bar |
| `TeamMemberRow` | `components/dashboard/team-member-row.tsx` | Member list item with role badge |
| `GatewayKeyRow` | `components/dashboard/gateway-key-row.tsx` | Key list item with revoke button |
| `TemplateCard` | `components/templates/template-card.tsx` | Template marketplace card |
| `CodeBottomSheet` | `components/builder/code-bottom-sheet.tsx` | Mobile code viewer bottom sheet |
| `CreateKeyModal` | `components/dashboard/create-key-modal.tsx` | One-time key display modal |

---

## Data Models

### Database Schema (new tables)

```sql
-- Projects
CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id     UUID REFERENCES teams(id) ON DELETE SET NULL,
  name        TEXT NOT NULL DEFAULT 'Untitled Project',
  files       JSONB NOT NULL DEFAULT '[]',
  vercel_project_id TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX projects_user_id_updated_at ON projects(user_id, updated_at DESC);
CREATE INDEX projects_team_id ON projects(team_id);

-- Messages
CREATE TABLE messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content     TEXT NOT NULL,
  files       JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX messages_project_id_created_at ON messages(project_id, created_at ASC);

-- Teams
CREATE TABLE teams (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  owner_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Team Members
CREATE TABLE team_members (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id   UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role      TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Team Invites
CREATE TABLE team_invites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  token       TEXT NOT NULL UNIQUE,
  invited_by  UUID NOT NULL REFERENCES auth.users(id),
  accepted_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Team Credits
CREATE TABLE team_credits (
  team_id    UUID PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,
  balance    NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Gateway Keys
CREATE TABLE gateway_keys (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  key_hash     TEXT NOT NULL UNIQUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  revoked_at   TIMESTAMPTZ
);

-- Gateway Usage
CREATE TABLE gateway_usage (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id       UUID NOT NULL REFERENCES gateway_keys(id),
  user_id      UUID NOT NULL REFERENCES auth.users(id),
  provider     TEXT NOT NULL,
  model        TEXT NOT NULL,
  credits_used NUMERIC NOT NULL,
  status       TEXT NOT NULL CHECK (status IN ('success','auth_error','credit_error','rate_limited','provider_error')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX gateway_usage_user_id ON gateway_usage(user_id, created_at DESC);

-- Notifications
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  message    TEXT NOT NULL,
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### RLS Policies

```sql
-- Projects: users see their own; team members see team projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects_owner" ON projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "projects_team_member" ON projects FOR SELECT
  USING (team_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM team_members WHERE team_id = projects.team_id AND user_id = auth.uid()
  ));
CREATE POLICY "projects_team_write" ON projects FOR UPDATE
  USING (team_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM team_members WHERE team_id = projects.team_id AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
  ));

-- Messages: users see their own
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_owner" ON messages FOR ALL USING (auth.uid() = user_id);

-- Teams: members can read; owner can write
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teams_member_read" ON teams FOR SELECT
  USING (EXISTS (SELECT 1 FROM team_members WHERE team_id = id AND user_id = auth.uid()));
CREATE POLICY "teams_owner_write" ON teams FOR ALL USING (auth.uid() = owner_id);

-- Team members: members can read their own team
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_members_read" ON team_members FOR SELECT
  USING (EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = team_members.team_id AND tm.user_id = auth.uid()));

-- Gateway keys: users see their own
ALTER TABLE gateway_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gateway_keys_owner" ON gateway_keys FOR ALL USING (auth.uid() = user_id);

-- Gateway usage: users see their own
ALTER TABLE gateway_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gateway_usage_owner" ON gateway_usage FOR SELECT USING (auth.uid() = user_id);

-- Notifications: users see their own
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_owner" ON notifications FOR ALL USING (auth.uid() = user_id);
```

### Existing Table Modifications

```sql
-- Add project_id to deployments
ALTER TABLE deployments ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
CREATE INDEX deployments_project_id ON deployments(project_id);
```

---

## Feature-by-Feature Implementation

### Feature 1: Persistent Builder Projects

**Data flow:**

```
User opens /builder (no projectId)
  → Builder component mounts
  → createProject(userId, "Untitled Project — {date}") called
  → Redirect to /builder?projectId={newId}

User opens /builder?projectId={id}
  → getProject(id) called (validates ownership via RLS)
  → If null/error → show error state with "Create new project" button
  → If found → load files into editor, load messages into chat panel

User sends message
  → insertUserMessage() called
  → POST /api/builder/chat
  → On response: upsertProjectFiles() called
  → insertAssistantMessage() called
```

**Key implementation notes:**

- The builder page (`app/builder/page.tsx`) reads `searchParams.projectId` and passes it to the `BuilderClient` component.
- `upsertProjectFiles` uses Supabase's `.upsert()` with `onConflict: 'id'` and updates `updated_at` via a trigger or explicit set.
- The projects list at `/dashboard/projects` uses a Server Component to fetch the initial list, then a Client Component for optimistic rename/delete.
- Rename uses an inline edit pattern: clicking the project name shows an `<input>` in place, blur/Enter commits.
- Delete shows a shadcn `AlertDialog` before calling `DELETE /api/projects/[id]`.

### Feature 2: Per-User Vercel Project Isolation

**Data flow:**

```
User triggers deploy for project with no vercel_project_id
  → POST /api/builder/deploy with { files, projectName, projectId }
  → Vercel_Provisioner: POST https://api.vercel.com/v9/projects
      name: "masidy-{userId}-{projectId}".slice(0,52).toLowerCase().replace(/[^a-z0-9]/g,'-')
  → On success: setVercelProjectId(projectId, vercelProjectId)
  → Continue with deployment to that project

User triggers deploy for project with existing vercel_project_id
  → POST /api/builder/deploy with { files, projectName, projectId, vercelProjectId }
  → Vercel_Provisioner: POST https://api.vercel.com/v13/deployments?teamId={TEAM}
      with projectId query param pointing to existing project
  → Save deployment record with project_id
```

**Vercel project naming:**

```typescript
function buildVercelProjectName(userId: string, projectId: string): string {
  const raw = `masidy-${userId}-${projectId}`;
  return raw.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 52);
}
```

**Deploy route changes** — The existing `app/api/builder/deploy/route.ts` is extended to:
1. Accept `projectId` and `vercelProjectId` in the request body.
2. Call `createVercelProject()` if `vercelProjectId` is absent.
3. Pass `projectId` when inserting the deployment record.
4. Return the `vercelProjectId` in the response so the client can store it.

### Feature 3: Persistent Chat History

**Data flow:**

```
User sends message in Builder
  → insertUserMessage(userId, projectId, content) — fire and forget (non-blocking)
  → POST /api/builder/chat
  → On success: insertAssistantMessage(userId, projectId, explanation, files) — fire and forget

Builder loads with projectId
  → GET /api/projects/[id]/messages
  → Render messages in chat panel in created_at ASC order
```

**Non-blocking persistence** — Message inserts are fire-and-forget (`void insertUserMessage(...)`) so they never delay the AI response. Errors are caught and logged per Requirement 3.9.

**Agent Sessions page** — Uses a Supabase query with a JOIN:

```sql
SELECT p.id as project_id, p.name as project_name,
       COUNT(m.id) as message_count,
       MAX(m.created_at) as last_message_at
FROM projects p
INNER JOIN messages m ON m.project_id = p.id
WHERE p.user_id = auth.uid()
GROUP BY p.id, p.name
ORDER BY last_message_at DESC;
```

### Feature 4: Stripe Webhook Verification

**Changes to `app/api/webhooks/stripe/route.ts`:**

The existing handler already calls `stripe.webhooks.constructEvent`. The following gaps are filled:

1. **`payment_intent.payment_failed` handling** — Insert a row into `notifications` table.
2. **Missing/invalid metadata guard** — Check `user_id` and `credits` before calling `addCredits`; log and return 200 if invalid.
3. **`addCredits` error handling** — Wrap in try/catch; return HTTP 500 on exception so Stripe retries.
4. **Unknown event types** — Explicit `default` case returning `{ received: true }`.

```typescript
// Updated handler structure
export async function POST(req: NextRequest) {
  const body = await req.text();  // raw body — critical for signature verification
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": { /* validate metadata, addCredits, catch→500 */ break; }
    case "payment_intent.payment_failed": { /* insert notification row */ break; }
    default: break;
  }
  return NextResponse.json({ received: true });
}
```

### Feature 5: Team / Workspace Support

**Team creation flow:**

```
POST /api/teams { name }
  → Insert into teams (id, name, owner_id=userId)
  → Insert into team_members (team_id, user_id, role='owner')
  → Insert into team_credits (team_id, balance=0)
  → Redirect to /dashboard/settings/team
```

**Invite flow:**

```
POST /api/teams/[id]/invite { email }
  → Verify requester is owner or admin
  → Generate token: crypto.randomBytes(32).toString('hex')
  → Insert into team_invites
  → Send email via Resend/Nodemailer with accept URL
  → Return 200 (email send failure does not block response)

GET /team/accept?token={token}
  → Look up team_invites by token
  → If not found or accepted_at is set → show error page
  → If valid → insert team_members (role='member'), set accepted_at
  → Redirect to /dashboard
```

**Credit deduction for team projects:**

The `deductCredits` function in `lib/credits.ts` is extended with a `teamId` parameter. When `teamId` is provided, it deducts from `team_credits` instead of `credits`. The builder chat and deploy routes pass `teamId` when the project has a non-null `team_id`.

```typescript
// Extended signature
export async function deductCredits(
  userId: string,
  action: CreditAction,
  description: string,
  teamId?: string
): Promise<{ success: boolean; remaining: number; error?: string }>
```

**Team deletion cascade:**

```sql
-- Handled by ON DELETE CASCADE on team_members, team_invites, team_credits
-- Projects: team_id set to NULL via ON DELETE SET NULL
DELETE FROM teams WHERE id = $1 AND owner_id = $2;
```

### Feature 6: Real AI Gateway

**Request flow:**

```
POST /api/gateway { provider, model, messages, stream? }
  Authorization: Bearer msk_...

  1. Extract key from Authorization header
  2. validateGatewayKey(key) → GatewayKey | null
  3. If null or revoked_at set → 401, record usage(status='auth_error')
  4. rateLimit(`gateway:${keyId}`, 60, 60_000) → if exceeded → 429, record usage(status='rate_limited')
  5. deductCredits(userId, modelTierAction, description) → if insufficient → 402, record usage(status='credit_error')
  6. Forward to provider API using platform server-side keys
  7. On provider error → 502, record usage(status='provider_error')
  8. On success → stream/return response, record usage(status='success')
  9. Update gateway_keys.last_used_at
```

**Provider routing:**

```typescript
const PROVIDER_ENDPOINTS: Record<GatewayProvider, string> = {
  anthropic: 'https://api.anthropic.com/v1/messages',
  openai:    'https://api.openai.com/v1/chat/completions',
  gemini:    'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
};

const PROVIDER_ENV_KEYS: Record<GatewayProvider, string> = {
  anthropic: 'ANTHROPIC_API_KEY',
  openai:    'OPENAI_API_KEY',
  gemini:    'GEMINI_API_KEY',
};
```

**Key generation:**

```typescript
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';

const plaintext = `msk_${randomBytes(32).toString('hex')}`;
const key_hash = await bcrypt.hash(plaintext, 10);
// Store key_hash in DB, return plaintext once to user
```

**Key validation** — Because bcrypt comparison is O(n) per key and we can't index hashes for lookup, we store a secondary lookup index: the first 8 chars of the plaintext key (after `msk_`) as a `key_prefix` column. On validation, we filter by prefix first, then bcrypt-compare the candidates. This keeps validation fast without storing plaintext.

**Rate limiting** — Uses the existing `lib/ratelimit.ts` in-memory store with key `gateway:{keyId}`. For production multi-instance deployments, this should be replaced with Upstash Redis (same interface, drop-in replacement).

### Feature 7: Template Marketplace

**Template data structure** — Templates are static TypeScript objects in `lib/templates.ts`. Each template contains the complete file set needed for a deployable Next.js 14 App Router project. This avoids a DB round-trip on the public `/templates` page and keeps templates version-controlled.

**"Use template" flow (authenticated):**

```
User clicks "Use template" on /templates
  → POST /api/projects { templateId }
  → Server: getTemplate(templateId) → files
  → createProject(userId, template.name, files)
  → Return { projectId }
  → Client: router.push(`/builder?projectId=${projectId}`)
```

**"Use template" flow (unauthenticated):**

```
User clicks "Use template" on /templates (not logged in)
  → router.push(`/auth/signup?template=${templateId}`)

After signup + onboarding completion:
  → Read template param from URL
  → POST /api/projects { templateId }
  → Navigate to builder
```

**Onboarding integration** — The existing onboarding step 3 (template selection) stores the selected `templateId` in component state. On completion, it calls `createProject` with the template files before navigating to the builder.

**Template Marketplace page** — Server Component (no auth required). Renders template cards using static `TEMPLATES` data. The "Use template" button is a Client Component that checks auth state and either creates a project or redirects to signup.

**Template card design:**

```tsx
<div className="p-6 border border-foreground/10 hover:border-foreground/20 transition-all duration-300 group">
  <div className="flex items-start justify-between mb-4">
    <span className="text-xs font-mono bg-foreground/[0.02] border border-foreground/10 px-2 py-1">
      {template.badge}
    </span>
  </div>
  <h3 className="text-xl font-display mb-2">{template.name}</h3>
  <p className="text-sm text-muted-foreground mb-6">{template.description}</p>
  <button className="flex items-center gap-2 bg-foreground text-background text-sm font-medium px-5 h-9 rounded-full hover:bg-foreground/80 transition-colors">
    Use template <ArrowRight className="w-3.5 h-3.5" />
  </button>
</div>
```

### Feature 8: Mobile Experience

**Dashboard layout changes** — The existing `app/dashboard/layout.tsx` is updated to:
1. Wrap content in a responsive container.
2. Render `<BottomNav />` below the main content on mobile (hidden on `md:` and above).
3. Hide the `<AppSidebar />` on mobile using `hidden md:flex`.

**Bottom navigation bar:**

```tsx
// components/dashboard/bottom-nav.tsx
// Fixed at bottom, bg-background, border-t border-foreground/10
// Icons: Home, FolderOpen, Hammer, CreditCard, User (lucide-react)
// Active state: text-foreground; inactive: text-muted-foreground
// Labels: text-[10px] font-mono below each icon
```

**Tablet sidebar (768px–1024px)** — The `<AppSidebar />` uses shadcn's `SidebarProvider` with `defaultOpen={false}` on tablet. The sidebar renders icon-only (collapsed) by default, expanding on click. This is handled by the existing `SidebarTrigger` + CSS.

**Builder mobile layout** — The builder page uses Tailwind responsive classes:

```tsx
// Editor + file tree: hidden on mobile, visible on md:
<div className="hidden md:flex flex-col ...">
  <FileTree />
  <CodeEditor />
</div>

// Chat panel: full width on mobile, fixed width on md:
<div className="flex-1 md:w-[400px] ...">
  <ChatPanel />
</div>

// "View code" button: visible only on mobile
<button className="md:hidden ...">
  <Code className="w-4 h-4" /> View code
</button>
```

**Mobile code bottom sheet** — A `<CodeBottomSheet>` component uses a `fixed inset-x-0 bottom-0` panel with `translate-y` animation. It contains the file tree and code editor. Triggered by the "View code" button.

**Mobile deploy status** — On mobile, the deploy result (URL + status) is injected as an assistant message in the chat panel instead of the terminal panel. The builder detects `window.innerWidth < 768` and routes the deploy result accordingly.

**Chat input on mobile** — The chat input is `position: fixed; bottom: 56px` (above the 56px bottom nav) on mobile. The send button has `min-h-[44px] min-w-[44px]` for tap target compliance.

**No horizontal scroll** — All pages use `max-w-full overflow-x-hidden` on the root container. Tables on mobile use `overflow-x-auto` wrappers. Long strings (URLs, hashes) use `truncate` or `break-all`.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 0: Reflection Notes

**Validates: Requirements 1.2, 1.4, 3.2, 3.3, 5.5, 5.7, 6.9, 6.10, 7.1, 7.6, 7.7, 7.8, 7.9, 7.10**

Before listing properties, redundancies are eliminated:

- Properties 1.2 (upsert files) and 1.4 (load project) both test file round-trips. They are kept separate because 1.2 tests the write path and 1.4 tests the read path — together they form a complete round-trip.
- Properties 3.2 and 3.3 (user message insert, assistant message insert) are kept separate because they test different roles and different code paths.
- Properties 6.9 (key hashing) and 6.10 (revoke then reject) are kept separate — one tests the creation invariant, the other tests the revocation round-trip.
- Properties 5.5 (team creation) and 5.7 (invite acceptance) are kept separate — different flows.
- Properties 7.1 and 7.6–7.10 (template file requirements) are consolidated into a single property covering all templates.

---

### Property 1: Project files upsert round-trip

*For any* project and any set of files, after calling `upsertProjectFiles(projectId, files)`, querying the project row should return a `files` array that is deeply equal to the input files array.

**Validates: Requirements 1.2**

---

### Property 2: Project load by ID returns correct files

*For any* project created with a given file set, loading that project by its ID should return the same file set that was stored.

**Validates: Requirements 1.4**

---

### Property 3: Projects list is sorted by updated_at descending

*For any* set of projects belonging to a user, the list returned by `listProjects(userId)` should be ordered such that for every adjacent pair `(a, b)`, `a.updated_at >= b.updated_at`.

**Validates: Requirements 1.5**

---

### Property 4: Project rename round-trip

*For any* valid project name string (non-empty, ≤255 chars), after calling `renameProject(projectId, name)`, reading the project should return that exact name.

**Validates: Requirements 1.8**

---

### Property 5: Vercel project name satisfies naming convention

*For any* userId and projectId strings, the generated Vercel project name `buildVercelProjectName(userId, projectId)` should: (a) be ≤52 characters, (b) be lowercase, (c) contain only `[a-z0-9-]` characters, and (d) start with `masidy-`.

**Validates: Requirements 2.1**

---

### Property 6: Deployments are user-scoped

*For any* user, querying the deployments table with that user's ID should return only rows where `user_id` equals that user's ID — no other user's deployments should appear.

**Validates: Requirements 2.5**

---

### Property 7: User messages are persisted with correct role

*For any* message content string, after calling `insertUserMessage(userId, projectId, content)`, querying messages for that project should include a row with `role = 'user'` and `content` equal to the input.

**Validates: Requirements 3.2**

---

### Property 8: Assistant messages are persisted with correct role and files

*For any* assistant response with explanation text and files array, after calling `insertAssistantMessage(...)`, querying messages for that project should include a row with `role = 'assistant'`, matching content, and matching files.

**Validates: Requirements 3.3**

---

### Property 9: Messages are ordered by created_at ascending

*For any* set of messages for a project, the list returned by `getProjectMessages(projectId)` should be ordered such that for every adjacent pair `(a, b)`, `a.created_at <= b.created_at`.

**Validates: Requirements 3.4**

---

### Property 10: Webhook credits are added for any valid metadata

*For any* valid `user_id` UUID and positive integer `credits` value in `checkout.session.completed` metadata, after the webhook handler processes the event, the user's credit balance should increase by exactly that `credits` amount.

**Validates: Requirements 4.3**

---

### Property 11: Unknown webhook event types always return 200

*For any* Stripe event type string that is not `checkout.session.completed` or `payment_intent.payment_failed`, the webhook handler should return HTTP 200 with body `{"received": true}` without modifying any database state.

**Validates: Requirements 4.6**

---

### Property 12: Team creation produces owner membership

*For any* team name string, after `createTeam(userId, name)`, the `team_members` table should contain exactly one row for that team with `user_id = userId` and `role = 'owner'`.

**Validates: Requirements 5.5**

---

### Property 13: Invite token is unique and cryptographically random

*For any* two invite operations (even for the same email and team), the generated tokens should be different. Each token should be a 64-character hex string (32 bytes of randomness).

**Validates: Requirements 5.6**

---

### Property 14: Invite acceptance creates membership and marks invite used

*For any* valid, unaccepted invite token, after `acceptInvite(token, userId)`, the `team_members` table should contain a row for that user, and the `team_invites` row should have `accepted_at` set to a non-null timestamp.

**Validates: Requirements 5.7**

---

### Property 15: Team project actions deduct from team credits, not user credits

*For any* team project action that costs N credits, after the action completes, `team_credits.balance` should decrease by N and the individual user's `credits.balance` should be unchanged.

**Validates: Requirements 5.12**

---

### Property 16: Team deletion leaves no orphaned rows

*For any* team, after `deleteTeam(teamId)`, there should be no rows in `team_members`, `team_invites`, or `team_credits` referencing that team, and all previously associated projects should have `team_id = null`.

**Validates: Requirements 5.15**

---

### Property 17: Gateway key hash is never equal to plaintext

*For any* generated gateway key, the `key_hash` stored in the database should not equal the plaintext key, and the plaintext key should start with `msk_`.

**Validates: Requirements 6.9**

---

### Property 18: Revoked gateway keys are rejected

*For any* gateway key that has been revoked (i.e., `revoked_at` is set), using that key in a request to `/api/gateway` should return HTTP 401.

**Validates: Requirements 6.10**

---

### Property 19: Rate limit is enforced per key

*For any* gateway key, after exactly 60 successful requests within a 60-second window, the 61st request should return HTTP 429 with a `Retry-After` header.

**Validates: Requirements 6.11**

---

### Property 20: Every gateway request produces a usage row

*For any* request to `/api/gateway` regardless of outcome (success, auth error, credit error, rate limit, provider error), exactly one row should be inserted into `gateway_usage` with the correct `status` value.

**Validates: Requirements 6.12**

---

### Property 21: All templates contain required files

*For any* template in the `TEMPLATES` registry, the template's `files` array should contain all required files for that template type (as specified in Requirements 7.6–7.10), and each file should have non-empty `content`.

**Validates: Requirements 7.1, 7.6, 7.7, 7.8, 7.9, 7.10**

---

### Property 22: Template selection round-trip preserves files

*For any* template, after creating a project from that template via `createProject(userId, template.name, template.files)`, loading the project by ID should return a `files` array deeply equal to the template's `files` array.

**Validates: Requirements 7.2, 7.5**

---

## Error Handling

### Project Load Failure

When `getProject(id)` returns null (row not found or RLS denied), the builder renders an explicit error state:

```tsx
<div className="flex flex-col items-center justify-center h-full gap-4 p-8">
  <p className="text-sm text-muted-foreground">
    Project not found or you don't have access to it.
  </p>
  <button onClick={() => router.push('/builder')} className="...rounded-full...">
    Create new project <ArrowRight className="w-4 h-4" />
  </button>
</div>
```

The builder never silently creates a new project in place of a failed load.

### Vercel Provisioning Failure

If `createVercelProject()` fails, the deploy route returns the error immediately. The builder displays it in the terminal panel (desktop) or as an assistant message (mobile). No partial state is written.

### Chat Store Insert Failure

Message inserts are fire-and-forget. Errors are caught with `try/catch` and logged to `console.error`. The builder continues normally. This matches Requirement 3.9.

### Stripe Webhook Errors

- Invalid signature → HTTP 400 (Stripe will not retry).
- Missing/invalid metadata → HTTP 200 (Stripe will not retry; event is logged).
- `addCredits` throws → HTTP 500 (Stripe will retry up to its retry policy).

### Gateway Errors

All gateway errors are recorded in `gateway_usage` before returning. This ensures the usage log is complete even for failed requests. The `recordGatewayUsage` call is wrapped in its own try/catch so a logging failure never masks the original error response.

### Team Invite Email Failure

Email sending is fire-and-forget. The invite row is inserted first; if the email fails, the invite still exists and can be resent. The API returns 200 regardless of email send outcome.

---

## Testing Strategy

### Unit Tests

Unit tests cover specific examples, edge cases, and error conditions. They use Vitest with `@testing-library/react` for component tests.

**Key unit test areas:**
- `buildVercelProjectName()` — naming convention, length truncation, character replacement
- `extractJSON()` in the chat route — all three parsing strategies
- `deductCredits()` — insufficient balance, successful deduction, team vs. user routing
- `validateGatewayKey()` — valid key, revoked key, non-existent key
- Webhook handler — invalid signature, missing metadata, `addCredits` throw
- Template file completeness — each template has required files

### Property-Based Tests

Property-based tests use **fast-check** (TypeScript-native, works with Vitest). Each test runs a minimum of 100 iterations.

```typescript
// Example: Property 3 — projects list sort order
import fc from 'fast-check';
import { test, expect } from 'vitest';

test('projects list is sorted by updated_at descending', () => {
  // Feature: masidy-missing-features, Property 3: projects list sorted descending
  fc.assert(fc.asyncProperty(
    fc.array(fc.record({
      id: fc.uuid(),
      updated_at: fc.date().map(d => d.toISOString()),
      name: fc.string({ minLength: 1 }),
    }), { minLength: 1, maxLength: 20 }),
    async (projects) => {
      // Seed mock DB, call listProjects, verify sort order
      const result = sortByUpdatedAtDesc(projects);
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].updated_at >= result[i+1].updated_at).toBe(true);
      }
    }
  ), { numRuns: 100 });
});
```

**Property tests to implement (one test per property):**

| Property | Test file | fast-check generators |
|---|---|---|
| 1: Project files upsert round-trip | `__tests__/projects.property.test.ts` | `fc.array(fc.record({path, content, language}))` |
| 2: Project load by ID | `__tests__/projects.property.test.ts` | Same as above |
| 3: Projects list sort order | `__tests__/projects.property.test.ts` | `fc.array(fc.record({id, updated_at, name}))` |
| 4: Project rename round-trip | `__tests__/projects.property.test.ts` | `fc.string({minLength:1, maxLength:255})` |
| 5: Vercel project name convention | `__tests__/vercel.property.test.ts` | `fc.uuid(), fc.uuid()` |
| 6: Deployments user-scoped | `__tests__/deployments.property.test.ts` | `fc.uuid()` (userId) |
| 7–9: Message persistence and ordering | `__tests__/messages.property.test.ts` | `fc.string(), fc.date()` |
| 10–11: Webhook credit/event handling | `__tests__/webhook.property.test.ts` | `fc.uuid(), fc.integer({min:1})` |
| 12–16: Team operations | `__tests__/teams.property.test.ts` | `fc.string(), fc.uuid()` |
| 17–20: Gateway key/usage | `__tests__/gateway.property.test.ts` | `fc.string(), fc.integer({min:1,max:60})` |
| 21–22: Template files | `__tests__/templates.property.test.ts` | `fc.constantFrom(...TEMPLATES)` |

### Integration Tests

Integration tests run against a local Supabase instance (via `supabase start`):

- RLS policy enforcement — verify cross-user data isolation
- Stripe webhook end-to-end — use Stripe CLI `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- Vercel provisioning — mock Vercel API responses with `msw`

### Smoke Tests

- Database migration applies cleanly
- All required environment variables are present at startup
- RLS is enabled on all new tables
