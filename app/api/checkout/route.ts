import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, CREDIT_PACKS } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { packId } = await req.json();
  const pack = CREDIT_PACKS.find((p) => p.id === packId);
  if (!pack) return NextResponse.json({ error: "Invalid pack" }, { status: 400 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const stripe = getStripe();

  // Use price ID if available (from Stripe dashboard), otherwise use inline price_data
  const lineItem = pack.priceId
    ? { price: pack.priceId, quantity: 1 }
    : {
        price_data: {
          currency: "usd",
          unit_amount: pack.price,
          product_data: {
            name: `Masidy ${pack.label} Credit Pack`,
            description: `${pack.credits} credits — never expire, use on any Masidy feature`,
            images: [`${appUrl}/icon.svg`],
          },
        },
        quantity: 1,
      };

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email,
    line_items: [lineItem],
    metadata: {
      user_id: user.id,
      pack_id: pack.id,
      credits: pack.credits.toString(),
    },
    success_url: `${appUrl}/dashboard/billing?success=1&credits=${pack.credits}`,
    cancel_url: `${appUrl}/dashboard/billing?cancelled=1`,
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
