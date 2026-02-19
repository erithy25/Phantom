import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe, PLANS, type PlanKey } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan } = (await req.json()) as { plan?: string };

    if (!plan || !(plan in PLANS)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const planKey = plan as PlanKey;
    const selectedPlan = PLANS[planKey];

    if (!selectedPlan.priceId) {
      return NextResponse.json(
        { error: "This plan does not require payment" },
        { status: 400 }
      );
    }

    // Find or create Stripe customer
    const subscription = await db.subscription.findUnique({
      where: { userId: session.user.id },
    });

    let customerId = subscription?.stripeCustomerId;

    if (!customerId) {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { email: true, name: true },
      });

      const customer = await stripe.customers.create({
        email: user?.email || undefined,
        name: user?.name || undefined,
        metadata: { userId: session.user.id },
      });

      customerId = customer.id;

      // Upsert subscription record with customer ID
      await db.subscription.upsert({
        where: { userId: session.user.id },
        update: { stripeCustomerId: customerId },
        create: {
          userId: session.user.id,
          stripeCustomerId: customerId,
          plan: "FREE",
        },
      });
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: selectedPlan.priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL}/settings?tab=account&checkout=success`,
      cancel_url: `${process.env.NEXTAUTH_URL}/settings?tab=account&checkout=cancelled`,
      metadata: {
        userId: session.user.id,
        plan: planKey,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
