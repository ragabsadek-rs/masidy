import { NextRequest, NextResponse } from "next/server";
import { getEnvVars, createEnvVar, deleteEnvVar } from "@/lib/vercel";
import { CreateEnvVarSchema, DeleteEnvVarSchema, parseBody } from "@/lib/validation";

export async function GET() {
  try {
    const envs = await getEnvVars();
    // Return keys only — never expose values
    return NextResponse.json(envs.map((e: { key: string; id: string; target: string[]; type: string; updatedAt: number }) => ({
      id: e.id, key: e.key, target: e.target, type: e.type, updatedAt: e.updatedAt,
    })));
  } catch {
    return NextResponse.json({ error: "Failed to fetch env vars" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { data, error } = parseBody(CreateEnvVarSchema, body);
  if (error || !data) return NextResponse.json({ error: error ?? "Invalid request" }, { status: 400 });

  try {
    return NextResponse.json(await createEnvVar(data.key, data.value, data.target));
  } catch {
    return NextResponse.json({ error: "Failed to create env var" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { data, error } = parseBody(DeleteEnvVarSchema, body);
  if (error || !data) return NextResponse.json({ error: error ?? "Invalid request" }, { status: 400 });

  try {
    return NextResponse.json(await deleteEnvVar(data.id));
  } catch {
    return NextResponse.json({ error: "Failed to delete env var" }, { status: 500 });
  }
}
