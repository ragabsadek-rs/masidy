import { NextResponse } from "next/server";
import { getProject, getDomains, getDeployments } from "@/lib/vercel";

export async function GET() {
  try {
    const [project, domains, deployments] = await Promise.all([
      getProject(), getDomains(), getDeployments(5),
    ]);
    return NextResponse.json({ project, domains, deployments });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
