import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
  typescript: true,
});

export const PLANS = {
  FREE: {
    name: "Free",
    description: "Get started with Phantom",
    price: 0,
    priceId: "",
    features: [
      "3 AI chats per day",
      "Basic GPA tracking",
      "1 course connection",
      "Community support",
    ],
  },
  PRO: {
    name: "Pro",
    description: "For serious students",
    price: 499,
    priceId: process.env.STRIPE_PRO_PRICE_ID || "",
    features: [
      "Unlimited AI chats",
      "Full GPA optimization lab",
      "Unlimited course connections",
      "Smart draft generation",
      "Lecture transcription (5/mo)",
      "Priority support",
    ],
  },
  GHOST: {
    name: "Ghost",
    description: "Full autonomy mode",
    price: 999,
    priceId: process.env.STRIPE_GHOST_PRICE_ID || "",
    features: [
      "Everything in Pro",
      "Unlimited lecture transcription",
      "Auto-submit drafts",
      "Professor style matching",
      "Exam prep engine",
      "Campus Pulse analytics",
      "Priority AI queue",
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;
