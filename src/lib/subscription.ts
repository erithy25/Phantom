import { db } from "@/lib/db";

export type PlanType = "FREE" | "PRO" | "GHOST";

export async function getUserPlan(userId: string): Promise<PlanType> {
  // Grant permanent Pro access to owner
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (user?.email === "erik.thye@icloud.com") return "PRO";

  const subscription = await db.subscription.findUnique({
    where: { userId },
    select: { plan: true, status: true, stripeCurrentPeriodEnd: true },
  });

  if (!subscription) return "FREE";

  // Check if subscription is active and not expired
  if (
    subscription.plan !== "FREE" &&
    subscription.status === "active" &&
    subscription.stripeCurrentPeriodEnd &&
    subscription.stripeCurrentPeriodEnd > new Date()
  ) {
    return subscription.plan as PlanType;
  }

  return "FREE";
}

// Features that require Pro subscription
export const PRO_FEATURES = [
  "/chat",       // Phantom AI
  "/gpa",        // GPA Lab
  "/lectures",   // Lecture Capture
  "/drafts",     // Smart Drafts
  "/pulse",      // Campus Pulse
] as const;

export function isProFeature(pathname: string): boolean {
  return PRO_FEATURES.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
}
