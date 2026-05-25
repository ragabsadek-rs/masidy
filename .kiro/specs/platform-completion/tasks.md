# Implementation Plan: Platform Completion

## Overview

Complete the Masidy platform by implementing all missing functionality across the builder, auth/onboarding, dashboard data wiring, agent/AI gateway pages, navigation fixes, and production polish. All UI must follow the Masidy design system (Tailwind semantic tokens, sharp corners, lucide-react icons, font-display/sans/mono roles).

## Tasks

- [x] 1. Fix deploy API to handle Next.js projects correctly with proper file structure
  - Review `app/api/builder/deploy/route.ts` and fix file structure to produce a valid Next.js project (app router, package.json, next.config)
  - Ensure the deployed project URL is returned in the response

- [x] 2. Add deploy status polling with real-time terminal log updates
  - Add polling in the builder page that calls Vercel deployments API to check deploy status
  - Stream real-time terminal log lines into the builder terminal UI component
  - Depends on: 1

- [x] 3. Handle deploy errors gracefully with user-friendly messages
  - Show error state in the terminal and a toast notification on deploy failure
  - Depends on: 2

- [x] 4. Verify live preview iframe loads the deployed URL
  - After a successful deploy, set the iframe src to the live deployment URL
  - Add a loading state to the iframe while deployment is in progress
  - Show an error state in the iframe area if the deploy fails
  - Depends on: 2

- [x] 5. Create welcome/onboarding page after first signup (/onboarding)
  - Create `app/onboarding/page.tsx` with steps: name/project setup, connect Vercel token, choose a starter template
  - Redirect to `/dashboard` on completion; mark onboarding complete in Supabase user metadata
  - Redirect new signups to `/onboarding` from the auth callback route

- [x] 6. Add email confirmation page with resend option (/auth/confirm)
  - Create `app/auth/confirm/page.tsx` with a confirmation message and resend button
  - Wire the resend button to Supabase resend email confirmation API
  - Show success/error toast after resend attempt

- [x] 7. Fix sidebar active state to highlight current page correctly
  - Update `components/dashboard/app-sidebar.tsx` to use `usePathname()` and apply active styles (underline `border-b-2 border-foreground`) to the current route

- [x] 8. Wire sign out button in sidebar to actually sign out
  - Wire the sign out button to call Supabase `signOut()` and redirect to `/auth/login`
  - Depends on: 7

- [x] 9. Add user profile page (/dashboard/profile)
  - Create `app/dashboard/profile/page.tsx` with fields: display name, email (read-only), avatar upload
  - Wire save to Supabase `updateUser` / user metadata
  - Add the profile link to the sidebar user menu

- [x] 10. Wire Analytics page to real Vercel Analytics API data
  - Update `app/api/vercel/analytics/route.ts` to fetch real data from Vercel Analytics API
  - Update the analytics dashboard page to render real data in charts
  - Add loading skeleton (`animate-pulse bg-foreground/10`) while data fetches

- [x] 11. Wire Speed Insights page to real Vercel Speed Insights API
  - Update the speed insights API route to fetch real Vercel Speed Insights data
  - Update the speed insights dashboard page to render real metrics
  - Add loading skeleton while data fetches

- [x] 12. Wire Observability metrics to real Vercel API
  - Update the observability API route to fetch edge requests and function invocations from Vercel API
  - Update the observability dashboard page to display real metrics
  - Add loading skeleton while data fetches

- [x] 13. Firewall — add ability to create/delete rules via Vercel API
  - Update `app/api/vercel/firewall/route.ts` to support POST (create rule) and DELETE (delete rule)
  - Add a form in the firewall dashboard page to create a new rule
  - Add a delete button per rule with a confirmation dialog (shadcn AlertDialog)
  - Show toast on success/failure

- [x] 14. Storage — add ability to create KV/Postgres/Blob stores via Vercel API
  - Update `app/api/vercel/storage/route.ts` to support POST for creating stores
  - Add a "Create Store" button and modal in the storage dashboard page
  - Show toast on success/failure

- [x] 15. Integrations — add ability to install integrations via Vercel API
  - Update `app/api/vercel/integrations/route.ts` to support POST for installing integrations
  - Add install buttons per integration in the integrations dashboard page
  - Show toast on success/failure

- [x] 16. Feature Flags — implement basic feature flag CRUD with Supabase storage
  - Create a `feature_flags` table in Supabase (id, name, enabled, created_at, user_id)
  - Create API routes for GET/POST/PATCH/DELETE feature flags
  - Update the flags dashboard page to list, create, toggle, and delete flags
  - Add confirmation dialog for delete; toast for all actions

- [x] 17. CDN — add cache purge functionality via Vercel API
  - Add a cache purge endpoint under `app/api/vercel/`
  - Add a "Purge Cache" button in the CDN dashboard page
  - Show toast on success/failure

- [ ] 18. Agent sessions page — show real chat history from Supabase
  - Create `app/dashboard/agent/sessions/page.tsx`
  - Fetch chat history from Supabase messages/sessions table
  - Render sessions list with timestamps and message previews
  - Add loading skeleton

- [~] 19. Agent tools page — show available MCP tools
  - Create `app/dashboard/agent/tools/page.tsx`
  - Display a list of available MCP tools with name, description, and status
  - Add loading skeleton

- [~] 20. AI Gateway routes — show real credit usage per model
  - Create `app/dashboard/ai-gateway/routes/page.tsx`
  - Query `credit_transactions` table grouped by model to show usage per route
  - Render as a data table with `font-mono` values and loading skeleton

- [~] 21. AI Gateway usage — real charts from credit_transactions table
  - Create `app/dashboard/ai-gateway/usage/page.tsx`
  - Query `credit_transactions` table for time-series data
  - Render usage charts using existing chart components and add loading skeleton

- [~] 22. Fix all sidebar nav links that point to non-existent sub-pages
  - Audit all sidebar nav links in `components/dashboard/app-sidebar.tsx` for broken routes
  - Create stub pages for: `observability/runtime`, `observability/build`, `firewall/rules`
  - Ensure all nav links resolve to existing pages

- [~] 23. Dashboard/builder page — redirect to /builder
  - Update `app/dashboard/builder/page.tsx` to redirect to `/builder`
  - Depends on: 22

- [~] 24. Add loading skeletons to all dashboard pages
  - Add `animate-pulse bg-foreground/10` skeleton blocks to every dashboard page that loads async data
  - Ensure skeletons match the layout of the real content (same grid/table structure)
  - Depends on: 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21

- [~] 25. Add toast notifications for all actions
  - Ensure every user action (domain added, env var saved, rule created, etc.) triggers a toast via the existing shadcn toast/sonner setup
  - Use consistent success/error messaging patterns across all dashboard pages
  - Depends on: 13, 14, 15, 16, 17

- [~] 26. Add confirmation dialogs for destructive actions
  - Add shadcn AlertDialog confirmation before: delete domain, delete env var, delete firewall rule, delete feature flag, delete store
  - Dialog must follow design system: `bg-background border border-foreground/10`, no rounded corners on container
  - Depends on: 13, 14, 16

- [~] 27. Fix all "Create team" / team functionality stubs
  - Locate all "Create team" stubs in the sidebar and dashboard
  - Either implement basic team creation (Supabase `teams` table) or replace stubs with a "Coming soon" state that does not break navigation

- [~] 28. Add search functionality to sidebar Find input
  - Wire the sidebar "Find" input to filter nav items by label in real time
  - Clear filter when input is emptied
  - Depends on: 7

- [~] 29. Wire notification bell in sidebar
  - Add a notifications dropdown/popover to the sidebar bell icon
  - Fetch recent notifications from Supabase or show empty state if no table exists
  - Mark notifications as read on open

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": [1, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 27, 29]
    },
    {
      "wave": 2,
      "tasks": [2, 8, 23, 28]
    },
    {
      "wave": 3,
      "tasks": [3, 4]
    },
    {
      "wave": 4,
      "tasks": [24, 25, 26]
    }
  ]
}
```

## Notes

- All UI must follow the Masidy design system: `bg-background`, `text-foreground`, `border-foreground/10`, sharp corners (no `rounded-lg`/`rounded-xl` on cards), `font-display`/`font-sans`/`font-mono` roles, lucide-react icons only.
- Loading states use `animate-pulse bg-foreground/10` skeleton blocks — never spinners.
- Tabs use underline style only: `border-b-2 border-foreground` for active tab.
- Confirmation dialogs use shadcn `AlertDialog` with `bg-background border border-foreground/10`.
- All Vercel API calls go through the existing `/api/vercel/*` route handlers.
- Supabase client is already configured in `lib/` — use existing helpers.
