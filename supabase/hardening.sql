-- ── Security hardening for handle_new_user ────────────────────────────────
-- Revoke direct execution from public roles so only the trigger can call it
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;

-- ── Service role bypass for credit operations ──────────────────────────────
-- Allow service role to read/write credits (needed for server-side deduction)
create policy "credits_service_role" on public.credits
  for all
  to service_role
  using (true)
  with check (true);

create policy "transactions_service_role" on public.credit_transactions
  for all
  to service_role
  using (true)
  with check (true);

create policy "profiles_service_role" on public.profiles
  for all
  to service_role
  using (true)
  with check (true);

create policy "projects_service_role" on public.projects
  for all
  to service_role
  using (true)
  with check (true);

create policy "deployments_service_role" on public.deployments
  for all
  to service_role
  using (true)
  with check (true);

-- ── Indexes for performance ────────────────────────────────────────────────
create index if not exists idx_credits_user_id on public.credits(user_id);
create index if not exists idx_transactions_user_id on public.credit_transactions(user_id);
create index if not exists idx_transactions_created_at on public.credit_transactions(created_at desc);
create index if not exists idx_projects_user_id on public.projects(user_id);
create index if not exists idx_deployments_user_id on public.deployments(user_id);
create index if not exists idx_deployments_project_id on public.deployments(project_id);
