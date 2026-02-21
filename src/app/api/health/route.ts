import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
  };

  // 1. Database check
  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = { connected: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    checks.database = { connected: false, error: msg };
  }

  // 2. ANTHROPIC_API_KEY check
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    checks.ai = {
      keyPresent: false,
      connected: false,
      error: "ANTHROPIC_API_KEY is not set. Add it in Vercel > Settings > Environment Variables, then redeploy.",
    };
    return NextResponse.json({ status: "error", ...checks }, { status: 503 });
  }

  checks.ai = { keyPresent: true, keyPrefix: apiKey.substring(0, 10) + "..." };

  // 3. Test actual Claude API call
  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 16,
      messages: [{ role: "user", content: "Say hi" }],
    });

    const text =
      response.content[0]?.type === "text" ? response.content[0].text : "";
    checks.ai = {
      ...(checks.ai as Record<string, unknown>),
      connected: true,
      model: response.model,
      testResponse: text,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    checks.ai = {
      ...(checks.ai as Record<string, unknown>),
      connected: false,
      error: errMsg,
    };
    return NextResponse.json({ status: "error", ...checks }, { status: 503 });
  }

  return NextResponse.json({ status: "ok", ...checks });
}
