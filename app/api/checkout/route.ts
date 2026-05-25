import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe, CREDIT_PACKS } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { packId } = await req.json();
  const pack = CREDIT_PACKS.find((p) => p.id === packId);
  if (!pack) return NextResponse.json({ error: "Invalid pack" }, { status: 400 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email,
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: pack.price,
          product_data: {
            name: `Masidy ${pack.label} Credit Pack`,
            description: `${pack.credits} credits for Masidy AI builder`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      user_id: user.id,
      pack_id: pack.id,
      credits: pack.credits.toString(),
    },
    success_url: `${appUrl}/dashboard?credits=added&pack=${pack.id}`,
    cancel_url: `${appUrl}/dashboard/billing`,
  });

  return NextResponse.json({ url: session.url });
}
