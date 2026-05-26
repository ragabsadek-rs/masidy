import { NextRequest, NextResponse } from "next/server";
import { AGENT_INFO, type AgentTier } from "@/lib/agent-tools";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ model: string }> }
) {
  const { model } = await params;
  const tier = model as AgentTier;
  const info = AGENT_INFO[tier];

  if (!info) {
    return NextResponse.json({ error: "Unknown agent model" }, { status: 404 });
  }

  return NextResponse.json(info);
}
