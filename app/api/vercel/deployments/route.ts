import { NextResponse } from "next/server";
import { getDeployments } from "@/lib/vercel";

export async function GET() {
  try {
    const deployments = await getDeployments(30);
    return NextResponse.json(deployments);
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch deployments" }, { status: 500 });
  }
}
