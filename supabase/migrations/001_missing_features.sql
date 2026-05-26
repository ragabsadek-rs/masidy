-- ============================================================
-- Masidy Missing Features — Database Migration
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. projects
CREATE TABLE IF NOT EXISTS projects (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id           UUID,
  name              TEXT NOT NULL DEFAULT 'Untitled Project',
  files             JSONB NOT NULL DEFAULT '[]',
  vercel_project_id TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS projects_user_id_updated_at ON projects(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS projects_team_id ON projects(team_id);

-- 2. messages
CREATE TABLE IF NOT EXISTS messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT NOT NULL,
  files      JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_project_id_created_at ON messages(project_id, created_at ASC);

-- 3. teams
CREATE TABLE IF NOT EXISTS teams (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  owner_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. team_members
CREATE TABLE IF NOT EXISTS team_members (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id   UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role      TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- 5. team_invites
CREATE TABLE IF NOT EXISTS team_invites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  token       TEXT NOT NULL UNIQUE,
  invited_by  UUID NOT NULL REFERENCES auth.users(id),
  accepted_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. team_credits
CREATE TABLE IF NOT EXISTS team_credits (
  team_id    UUID PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,
  balance    NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Add team_id FK to projects (after teams table exists)
ALTER TABLE projects ADD CONSTRAINT projects_team_id_fkey
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;

-- 8. gateway_keys
CREATE TABLE IF NOT EXISTS gateway_keys (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  key_hash     TEXT NOT NULL UNIQUE,
  key_prefix   TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  revoked_at   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS gateway_keys_key_prefix ON gateway_keys(key_prefix);

-- 9. gateway_usage
CREATE TABLE IF NOT EXISTS gateway_usage (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id       UUID NOT NULL REFERENCES gateway_keys(id),
  user_id      UUID NOT NULL REFERENCES auth.users(id),
  provider     TEXT NOT NULL,
  model        TEXT NOT NULL,
  credits_used NUMERIC NOT NULL,
  status       TEXT NOT NULL CHECK (status IN ('success','auth_error','credit_error','rate_limited','provider_error')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gateway_usage_user_id ON gateway_usage(user_id, created_at DESC);

-- 10. notifications
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  message    TEXT NOT NULL,
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_id ON notifications(user_id, created_at DESC);

-- 11. Add project_id to deployments
ALTER TABLE deployments ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS deployments_project_id ON deployments(project_id);

-- ============================================================
-- RLS Policies
-- ============================================================

-- projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects_owner" ON projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "projects_team_member_read" ON projects FOR SELECT
  USING (team_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM team_members WHERE team_id = projects.team_id AND user_id = auth.uid()
  ));
CREATE POLICY "projects_team_admin_write" ON projects FOR UPDATE
  USING (team_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM team_members WHERE team_id = projects.team_id AND user_id = auth.uid() AND role IN ('owner','admin')
  ));

-- messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_owner" ON messages FOR ALL USING (auth.uid() = user_id);

-- teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teams_member_read" ON teams FOR SELECT
  USING (EXISTS (SELECT 1 FROM team_members WHERE team_id = id AND user_id = auth.uid()));
CREATE POLICY "teams_owner_write" ON teams FOR ALL USING (auth.uid() = owner_id);

-- team_members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_members_read" ON team_members FOR SELECT
  USING (EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = team_members.team_id AND tm.user_id = auth.uid()));

-- team_invites
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_invites_team_admin" ON team_invites FOR ALL
  USING (EXISTS (SELECT 1 FROM team_members WHERE team_id = team_invites.team_id AND user_id = auth.uid() AND role IN ('owner','admin')));

-- team_credits
ALTER TABLE team_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_credits_member_read" ON team_credits FOR SELECT
  USING (EXISTS (SELECT 1 FROM team_members WHERE team_id = team_credits.team_id AND user_id = auth.uid()));

-- gateway_keys
ALTER TABLE gateway_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gateway_keys_owner" ON gateway_keys FOR ALL USING (auth.uid() = user_id);

-- gateway_usage
ALTER TABLE gateway_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gateway_usage_owner_read" ON gateway_usage FOR SELECT USING (auth.uid() = user_id);

-- notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_owner" ON notifications FOR ALL USING (auth.uid() = user_id);
