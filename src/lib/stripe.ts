import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
  typescript: true,
});

export const PLANS = {
  FREE: {
    name: "Free",
    description: "For individuals getting started",
    price: 0,
    priceId: "",
    features: [
      "Up to 3 projects",
      "Basic analytics",
      "Community support",
      "1GB storage",
    ],
  },
  PRO: {
    name: "Pro",
    description: "For professionals and small teams",
    price: 2900,
    priceId: process.env.STRIPE_PRO_PRICE_ID || "",
    features: [
      "Unlimited projects",
      "Advanced analytics",
      "Priority support",
      "50GB storage",
      "Custom domains",
      "API access",
    ],
  },
  ENTERPRISE: {
    name: "Enterprise",
    description: "For large organizations",
    price: 9900,
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || "",
    features: [
      "Everything in Pro",
      "Unlimited storage",
      "Dedicated support",
      "SSO / SAML",
      "Custom integrations",
      "SLA guarantee",
      "Audit logs",
    ],
  },
} as const;
