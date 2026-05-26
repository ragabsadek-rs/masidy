import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Try to connect to Supabase
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("credits")
        .select("id")
        .limit(1);

      if (error) {
        console.error("[/api/health] Supabase check failed:", error.message);
        return NextResponse.json(
          {
            status: "degraded",
            timestamp: new Date().toISOString(),
            services: { supabase: "error" },
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      services: { api: "ok", database: "ok" },
    });
  } catch (err) {
    console.error("[/api/health] Error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
