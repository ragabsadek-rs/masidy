import { NextRequest, NextResponse } from "next/server";
import { getDomains, addDomain, removeDomain } from "@/lib/vercel";

export async function GET() {
  try {
    const domains = await getDomains();
    return NextResponse.json(domains);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { domain } = await req.json();
  const result = await addDomain(domain);
  return NextResponse.json(result);
}

export async function DELETE(req: NextRequest) {
  const { domain } = await req.json();
  const result = await removeDomain(domain);
  return NextResponse.json(result);
}
