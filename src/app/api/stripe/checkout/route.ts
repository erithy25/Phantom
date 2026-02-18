import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe, PLANS } from "@/lib/stripe";
import { db } from "@/lib/db";
import { absoluteUrl } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { planId } = body;

    if (!planId || !["PRO", "ENTERPRISE"].includes(planId)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const plan = PLANS[planId as keyof typeof PLANS];

    if (!plan.priceId) {
      return NextResponse.json(
        { error: "Stripe price ID not configured" },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;

    // Get or create subscription record
    let subscription = await db.subscription.findUnique({
      where: { userId },
    });

    // If user already has a Stripe customer, create portal session
    if (subscription?.stripeCustomerId) {
      const stripeSession = await stripe.billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
        return_url: absoluteUrl("/billing"),
      });

      return NextResponse.json({ url: stripeSession.url });
    }

    // Create checkout session for new customer
    const stripeSession = await stripe.checkout.sessions.create({
      success_url: absoluteUrl("/billing?success=true"),
      cancel_url: absoluteUrl("/billing?canceled=true"),
      payment_method_types: ["card"],
      mode: "subscription",
      billing_address_collection: "auto",
      customer_email: session.user.email!,
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        planId,
      },
    });

    return NextResponse.json({ url: stripeSession.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
