import { NextRequest, NextResponse } from "next/server";
import { getStorages } from "@/lib/vercel";

const VERCEL_API = "https://api.vercel.com";
const TOKEN = process.env.VERCEL_ACCESS_TOKEN!;
const TEAM = process.env.VERCEL_TEAM_ID!;

function headers() {
  return {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
  };
}

export async function GET() {
  try {
    const stores = await getStorages();
    return NextResponse.json(stores);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, name } = body as { type?: string; name?: string };

    if (!type || !["kv", "postgres", "blob"].includes(type)) {
      return NextResponse.json(
        { error: "Missing or invalid field: type (must be kv, postgres, or blob)" },
        { status: 400 }
      );
    }

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Missing required field: name" },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({ teamId: TEAM });
    const res = await fetch(
      `${VERCEL_API}/v1/storage/stores?${params.toString()}`,
      {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ type, name: name.trim() }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      const message =
        data?.error?.message ?? data?.message ?? "Failed to create store";
      return NextResponse.json({ error: message }, { status: res.status });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred while creating the store" },
      { status: 500 }
    );
  }
}
