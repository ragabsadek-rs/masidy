import { NextResponse } from "next/server";
import { getFirewallRules } from "@/lib/vercel";

export async function GET() {
  try {
    const data = await getFirewallRules();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ rules: [] });
  }
}
