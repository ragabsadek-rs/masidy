import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createProject, listProjects } from "@/lib/projects";
import { getTemplate } from "@/lib/templates";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await listProjects(user.id);
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { name, templateId } = body as { name?: string; templateId?: string };

  let files = body.files ?? [];
  let projectName = name ?? `Untitled Project — ${new Date().toLocaleDateString()}`;

  if (templateId) {
    const template = getTemplate(templateId);
    if (template) {
      files = template.files;
      projectName = name ?? template.name;
    }
  }

  const project = await createProject(user.id, projectName, files);
  return NextResponse.json(project, { status: 201 });
}
