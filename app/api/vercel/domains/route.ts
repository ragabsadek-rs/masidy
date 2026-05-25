import { NextRequest, NextResponse } from "next/server";
import { getDomains, addDomain, removeDomain } from "@/lib/vercel";
import { AddDomainSchema, DeleteDomainSchema, parseBody } from "@/lib/validation";

export async function GET() {
  try {
    return NextResponse.json(await getDomains());
  } catch {
    return NextResponse.json({ error: "Failed to fetch domains" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { data, error } = parseBody(AddDomainSchema, body);
  if (error || !data) return NextResponse.json({ error: error ?? "Invalid request" }, { status: 400 });

  try {
    return NextResponse.json(await addDomain(data.domain));
  } catch {
    return NextResponse.json({ error: "Failed to add domain" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { data, error } = parseBody(DeleteDomainSchema, body);
  if (error || !data) return NextResponse.json({ error: error ?? "Invalid request" }, { status: 400 });

  try {
    return NextResponse.json(await removeDomain(data.domain));
  } catch {
    return NextResponse.json({ error: "Failed to remove domain" }, { status: 500 });
  }
}
