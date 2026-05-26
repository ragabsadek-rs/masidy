import { createAdminClient } from "@/lib/supabase/server";

export type ProjectFile = { path: string; content: string; language: string };

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

export async function createProject(
  userId: string,
  name: string,
  files: ProjectFile[] = []
): Promise<Project> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: userId,
      name,
      files,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create project: ${error.message}`);
  return data as Project;
}

export async function upsertProjectFiles(
  projectId: string,
  files: ProjectFile[]
): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("projects")
    .update({ files, updated_at: new Date().toISOString() })
    .eq("id", projectId);

  if (error) throw new Error(`Failed to upsert project files: ${error.message}`);
}

export async function getProject(projectId: string): Promise<Project | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (error) {
    // PostgREST returns PGRST116 when no rows are found
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to get project: ${error.message}`);
  }

  return data as Project;
}

export async function listProjects(userId: string): Promise<Project[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(`Failed to list projects: ${error.message}`);
  return (data ?? []) as Project[];
}

export async function renameProject(
  projectId: string,
  name: string
): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("projects")
    .update({ name, updated_at: new Date().toISOString() })
    .eq("id", projectId);

  if (error) throw new Error(`Failed to rename project: ${error.message}`);
}

export async function deleteProject(projectId: string): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);

  if (error) throw new Error(`Failed to delete project: ${error.message}`);
}

export async function setVercelProjectId(
  projectId: string,
  vercelProjectId: string
): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("projects")
    .update({ vercel_project_id: vercelProjectId })
    .eq("id", projectId);

  if (error) throw new Error(`Failed to set Vercel project ID: ${error.message}`);
}
