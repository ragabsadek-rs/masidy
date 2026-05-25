import { NextRequest, NextResponse } from "next/server";

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

export async function POST(req: NextRequest) {
  try {
    let paths: string[] | undefined;

    try {
      const body = await req.json();
      paths = body?.paths;
    } catch {
      // body is optional — ignore parse errors
    }

    const params = new URLSearchParams({ teamId: TEAM });
    const res = await fetch(
      `${VERCEL_API}/v1/projects/${PROJECT_ID}/purge-cache?${params.toString()}`,
      {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(paths && paths.length > 0 ? { paths } : {}),
      }
    );

    // Vercel returns 200 or 204 on success
    if (res.ok) {
      return NextResponse.json({ success: true });
    }

    let data: Record<string, unknown> = {};
    try {
      data = await res.json();
    } catch {
      // empty body on some responses
    }

    const message =
      (data?.error as { message?: string })?.message ??
      (data?.message as string) ??
      "Failed to purge CDN cache";

    return NextResponse.json({ error: message }, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred while purging the cache" },
      { status: 500 }
    );
  }
}
