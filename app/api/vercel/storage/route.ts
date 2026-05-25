import { NextResponse } from "next/server";
import { getStorages } from "@/lib/vercel";

export async function GET() {
  try {
    const stores = await getStorages();
    return NextResponse.json(stores);
  } catch {
    return NextResponse.json([]);
  }
}
