import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { addCredits } from "@/lib/credits";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.CheckoutSession;
    const { user_id, credits } = session.metadata ?? {};

    if (user_id && credits) {
      await addCredits(
        user_id,
        parseInt(credits),
        `Purchased ${credits} credits`
      );
    }
  }

  return NextResponse.json({ received: true });
}
