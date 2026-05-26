import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { addCredits } from "@/lib/credits";
import { createAdminClient } from "@/lib/supabase/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  // Must use raw body for signature verification
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.CheckoutSession;
      const userId = session.metadata?.user_id;
      const creditsStr = session.metadata?.credits;

      // Guard: validate metadata before touching the DB
      if (!userId || !creditsStr || isNaN(parseInt(creditsStr, 10))) {
        console.warn("checkout.session.completed: missing or invalid metadata", session.metadata);
        return NextResponse.json({ received: true });
      }

      const credits = parseInt(creditsStr, 10);
      try {
        await addCredits(userId, credits, `Purchased ${credits} credits`);
      } catch (err) {
        // Return 500 so Stripe retries the event
        console.error("addCredits failed in webhook:", err);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const intent = event.data.object as Stripe.PaymentIntent;
      const userId = intent.metadata?.user_id;
      if (userId) {
        try {
          const supabase = createAdminClient();
          await supabase.from("notifications").insert({
            user_id: userId,
            type: "payment_failed",
            message: `Payment failed: ${intent.last_payment_error?.message ?? "Unknown error"}`,
          });
        } catch (err) {
          console.warn("Failed to insert payment_failed notification:", err);
        }
      }
      break;
    }

    default:
      // All other event types — acknowledge without processing
      break;
  }

  return NextResponse.json({ received: true });
}
