import { createAdminClient } from "@/lib/supabase/server";
import type { ProjectFile } from "@/lib/projects";

export type MessageRole = "user" | "assistant";

export interface Message {
  id: string;
  user_id: string;
  project_id: string;
  role: MessageRole;
  content: string;
  files: ProjectFile[] | null;
  created_at: string;
}

export async function insertUserMessage(
  userId: string,
  projectId: string,
  content: string
): Promise<void> {
  try {
    const supabase = createAdminClient();

    await supabase.from("messages").insert({
      user_id: userId,
      project_id: projectId,
      role: "user" as MessageRole,
      content,
      files: null,
    });
  } catch {
    // Intentionally swallowed — message persistence must never break the caller
  }
}

export async function insertAssistantMessage(
  userId: string,
  projectId: string,
  content: string,
  files: ProjectFile[]
): Promise<void> {
  try {
    const supabase = createAdminClient();

    await supabase.from("messages").insert({
      user_id: userId,
      project_id: projectId,
      role: "assistant" as MessageRole,
      content,
      files,
    });
  } catch {
    // Intentionally swallowed — message persistence must never break the caller
  }
}

export async function getProjectMessages(projectId: string): Promise<Message[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Failed to get project messages: ${error.message}`);
  return (data ?? []) as Message[];
}

export async function listSessionProjects(userId: string): Promise<
  {
    project_id: string;
    project_name: string;
    message_count: number;
    last_message_at: string;
  }[]
> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("list_session_projects", {
    p_user_id: userId,
  });

  // Fall back to a manual join query if the RPC doesn't exist
  if (error) {
    const { data: rows, error: queryError } = await supabase
      .from("projects")
      .select(
        `
        id,
        name,
        messages!inner (
          id,
          created_at
        )
      `
      )
      .eq("user_id", userId);

    if (queryError) throw new Error(`Failed to list session projects: ${queryError.message}`);

    // Aggregate in JS since Supabase JS client doesn't support GROUP BY directly
    const aggregated = (rows ?? []).map((project: {
      id: string;
      name: string;
      messages: { id: string; created_at: string }[];
    }) => {
      const msgs = project.messages ?? [];
      const last = msgs.reduce(
        (max: string, m: { created_at: string }) =>
          m.created_at > max ? m.created_at : max,
        ""
      );
      return {
        project_id: project.id,
        project_name: project.name,
        message_count: msgs.length,
        last_message_at: last,
      };
    });

    return aggregated.sort((a, b) =>
      b.last_message_at.localeCompare(a.last_message_at)
    );
  }

  return (data ?? []) as {
    project_id: string;
    project_name: string;
    message_count: number;
    last_message_at: string;
  }[];
}
