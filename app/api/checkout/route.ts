import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, CREDIT_PACKS } from "@/lib/stripe";
import { CheckoutRequestSchema, parseBody } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { data, error } = parseBody(CheckoutRequestSchema, body);
  if (error || !data) return NextResponse.json({ error: error ?? "Invalid request" }, { status: 400 });

  const pack = CREDIT_PACKS.find((p) => p.id === data.packId);
  if (!pack) return NextResponse.json({ error: "Invalid pack" }, { status: 400 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const stripe = getStripe();

  const lineItem = pack.priceId
    ? { price: pack.priceId, quantity: 1 }
    : {
        price_data: {
          currency: "usd",
          unit_amount: pack.price,
          product_data: {
            name: `Masidy ${pack.label} Credit Pack`,
            description: `${pack.credits} credits — never expire`,
          },
        },
        quantity: 1,
      };

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email,
    line_items: [lineItem],
    metadata: { user_id: user.id, pack_id: pack.id, credits: pack.credits.toString() },
    success_url: `${appUrl}/dashboard/billing?success=1&credits=${pack.credits}`,
    cancel_url: `${appUrl}/dashboard/billing?cancelled=1`,
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
