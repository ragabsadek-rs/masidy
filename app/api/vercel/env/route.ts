import { NextRequest, NextResponse } from "next/server";
import { getEnvVars, createEnvVar, deleteEnvVar } from "@/lib/vercel";

export async function GET() {
  try {
    const envs = await getEnvVars();
    // Mask values for security
    return NextResponse.json(envs.map((e: { key: string; id: string; target: string[]; type: string; updatedAt: number }) => ({
      id: e.id, key: e.key, target: e.target, type: e.type, updatedAt: e.updatedAt,
    })));
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { key, value, target } = await req.json();
  const result = await createEnvVar(key, value, target ?? ["production", "preview", "development"]);
  return NextResponse.json(result);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const result = await deleteEnvVar(id);
  return NextResponse.json(result);
}
