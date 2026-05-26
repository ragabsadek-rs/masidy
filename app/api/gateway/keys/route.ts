import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createGatewayKey, listGatewayKeys } from "@/lib/gateway";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const keys = await listGatewayKeys(user.id);
  return NextResponse.json(keys);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { name } = body as { name?: string };
  if (!name?.trim()) return NextResponse.json({ error: "Key name is required" }, { status: 400 });

  const { key, record } = await createGatewayKey(user.id, name.trim());
  // Return plaintext key once — never stored again
  return NextResponse.json({ key, record }, { status: 201 });
}
