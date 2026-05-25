import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

// Credit packs — price in cents, credits granted
export const CREDIT_PACKS = [
  { id: "pack_5",   label: "$5",   price: 500,   credits: 50,   priceId: process.env.STRIPE_PRICE_5   },
  { id: "pack_10",  label: "$10",  price: 1000,  credits: 110,  priceId: process.env.STRIPE_PRICE_10  },
  { id: "pack_20",  label: "$20",  price: 2000,  credits: 240,  priceId: process.env.STRIPE_PRICE_20  },
  { id: "pack_50",  label: "$50",  price: 5000,  credits: 650,  priceId: process.env.STRIPE_PRICE_50  },
  { id: "pack_100", label: "$100", price: 10000, credits: 1400, priceId: process.env.STRIPE_PRICE_100 },
] as const;

// Credit cost per action
export const CREDIT_COSTS = {
  message_lite:     0.5,
  message_standard: 2,
  message_opus:     5,
  deploy:           1,
  domain:           2,
  storage_gb:       3,
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;
