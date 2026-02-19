import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import type Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("Stripe-Signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan || "PRO";

        if (!userId) break;

        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;

        if (subscriptionId) {
          const stripeSubscription =
            await stripe.subscriptions.retrieve(subscriptionId);

          await db.subscription.upsert({
            where: { userId },
            update: {
              stripeSubscriptionId: subscriptionId,
              stripePriceId:
                stripeSubscription.items.data[0]?.price.id || null,
              stripeCurrentPeriodEnd: new Date(
                stripeSubscription.current_period_end * 1000
              ),
              plan,
              status: stripeSubscription.status,
            },
            create: {
              userId,
              stripeCustomerId:
                typeof session.customer === "string"
                  ? session.customer
                  : session.customer?.id || null,
              stripeSubscriptionId: subscriptionId,
              stripePriceId:
                stripeSubscription.items.data[0]?.price.id || null,
              stripeCurrentPeriodEnd: new Date(
                stripeSubscription.current_period_end * 1000
              ),
              plan,
              status: stripeSubscription.status,
            },
          });
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription?.id;

        if (subscriptionId) {
          const stripeSubscription =
            await stripe.subscriptions.retrieve(subscriptionId);

          await db.subscription.updateMany({
            where: { stripeSubscriptionId: subscriptionId },
            data: {
              stripePriceId:
                stripeSubscription.items.data[0]?.price.id || null,
              stripeCurrentPeriodEnd: new Date(
                stripeSubscription.current_period_end * 1000
              ),
              status: stripeSubscription.status,
            },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;

        await db.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            stripePriceId: subscription.items.data[0]?.price.id || null,
            stripeCurrentPeriodEnd: new Date(
              subscription.current_period_end * 1000
            ),
            status: subscription.status,
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        await db.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            plan: "FREE",
            status: "canceled",
            stripePriceId: null,
            stripeSubscriptionId: null,
            stripeCurrentPeriodEnd: null,
          },
        });
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
