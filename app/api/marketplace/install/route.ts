import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getIntegrationBySlug } from "@/lib/integrations";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const slug = typeof body.slug === "string" ? body.slug : undefined;

  if (!slug) {
    return NextResponse.json({ error: "Missing integration slug" }, { status: 400 });
  }

  const integration = getIntegrationBySlug(slug);
  if (!integration) {
    return NextResponse.json({ error: "Integration not found" }, { status: 404 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await supabase
    .from("user_integrations")
    .select("id")
    .eq("user_id", user.id)
    .eq("integration_id", integration.id)
    .maybeSingle();

  if (existing.data) {
    return NextResponse.json({ alreadyInstalled: true, integration: { slug: integration.slug } }, { status: 200 });
  }

  const { data, error } = await supabase
    .from("user_integrations")
    .insert({
      user_id: user.id,
      integration_id: integration.id,
      slug: integration.slug,
      name: integration.name,
      provider: integration.provider,
      category: integration.category,
      description: integration.description,
      status: "installed",
    })
    .select()
    .single();

  if (error) {
    console.error("[/api/marketplace/install] Supabase error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ installed: true, integration: data }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Missing integration slug" }, { status: 400 });
  }

  const integration = getIntegrationBySlug(slug);
  if (!integration) {
    return NextResponse.json({ error: "Integration not found" }, { status: 404 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("user_integrations")
    .delete()
    .eq("user_id", user.id)
    .eq("integration_id", integration.id);

  if (error) {
    console.error("[/api/marketplace/install DELETE] Supabase error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ removed: true, slug });
}
