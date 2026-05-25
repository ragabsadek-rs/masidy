import { NextResponse } from "next/server";
import { getIntegrations } from "@/lib/vercel";

export async function GET() {
  try {
    const data = await getIntegrations();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([]);
  }
}
