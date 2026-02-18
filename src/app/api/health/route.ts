import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, string> = {};

  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch {
    checks.database = "error";
  }

  checks.stripe = process.env.STRIPE_SECRET_KEY ? "configured" : "not_configured";
  checks.auth = process.env.NEXTAUTH_SECRET ? "configured" : "not_configured";

  const allOk = checks.database === "ok";

  return NextResponse.json(
    {
      status: allOk ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allOk ? 200 : 503 }
  );
}
