import { NextResponse } from "next/server";
import { getAnalytics } from "@/lib/vercel";

export async function GET() {
  try {
    const data = await getAnalytics("day");
    return NextResponse.json(data ?? {});
  } catch {
    return NextResponse.json({});
  }
}
