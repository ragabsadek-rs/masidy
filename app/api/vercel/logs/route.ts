import { NextRequest, NextResponse } from "next/server";

const TOKEN = process.env.VERCEL_ACCESS_TOKEN!;
const TEAM = process.env.VERCEL_TEAM_ID!;

export async function GET(req: NextRequest) {
  const deploymentId = req.nextUrl.searchParams.get("deploymentId");
  if (!deploymentId) return NextResponse.json({ error: "Missing deploymentId" }, { status: 400 });

  const res = await fetch(
    `https://api.vercel.com/v2/deployments/${deploymentId}/events?teamId=${TEAM}&limit=200`,
    { headers: { Authorization: `Bearer ${TOKEN}` } }
  );
  const text = await res.text();
  // Vercel returns newline-delimited JSON
  try {
    const lines = text.trim().split("\n").filter(Boolean).map(l => JSON.parse(l));
    return NextResponse.json(lines);
  } catch {
    return NextResponse.json([]);
  }
}
