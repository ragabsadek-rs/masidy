import { NextRequest, NextResponse } from "next/server";
import { getFirewallRules } from "@/lib/vercel";

const VERCEL_API = "https://api.vercel.com";
const TOKEN = process.env.VERCEL_ACCESS_TOKEN!;
const TEAM = process.env.VERCEL_TEAM_ID!;
const PROJECT_ID = "prj_tw61YQKrLvVCogF6jdaCIsOBKDPA";

function headers() {
  return {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
  };
}

export async function GET() {
  try {
    const data = await getFirewallRules();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ rules: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ip, hostname, path, description } = body;

    if (!action) {
      return NextResponse.json(
        { error: "Missing required field: action" },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({ teamId: TEAM, projectId: PROJECT_ID });
    const res = await fetch(
      `${VERCEL_API}/v1/security/firewall/rules?${params.toString()}`,
      {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ action, ip, hostname, path, description }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      const message =
        data?.error?.message ?? data?.message ?? "Failed to create firewall rule";
      return NextResponse.json({ error: message }, { status: res.status });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred while creating the rule" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ruleId = searchParams.get("ruleId");

    if (!ruleId) {
      return NextResponse.json(
        { error: "Missing required parameter: ruleId" },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({ teamId: TEAM, projectId: PROJECT_ID });
    const res = await fetch(
      `${VERCEL_API}/v1/security/firewall/rules/${ruleId}?${params.toString()}`,
      {
        method: "DELETE",
        headers: headers(),
      }
    );

    if (res.status === 204 || res.status === 200) {
      return NextResponse.json({ success: true });
    }

    let data: Record<string, unknown> = {};
    try {
      data = await res.json();
    } catch {
      // empty body on some 204 responses
    }

    const message =
      (data?.error as { message?: string })?.message ??
      (data?.message as string) ??
      "Failed to delete firewall rule";
    return NextResponse.json({ error: message }, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred while deleting the rule" },
      { status: 500 }
    );
  }
}
