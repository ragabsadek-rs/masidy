import { NextRequest, NextResponse } from "next/server";
import { getIntegrations } from "@/lib/vercel";

const TEAM = process.env.VERCEL_TEAM_ID!;

export async function GET() {
  try {
    const data = await getIntegrations();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug } = body as { slug?: string };

    if (!slug || !slug.trim()) {
      return NextResponse.json(
        { error: "Missing required field: slug" },
        { status: 400 }
      );
    }

    const installUrl = TEAM
      ? `https://vercel.com/integrations/${slug.trim()}/new?teamId=${TEAM}`
      : `https://vercel.com/integrations/${slug.trim()}/new`;

    return NextResponse.json({ installUrl }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
