import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

export async function GET() {
  const results: Record<string, unknown> = {
    status: "ok",
    timestamp: new Date().toISOString(),
  };

  // Check if ANTHROPIC_API_KEY is set
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        ...results,
        status: "error",
        ai: {
          connected: false,
          error:
            "ANTHROPIC_API_KEY is not set. Add it to your Vercel environment variables and redeploy.",
        },
      },
      { status: 503 }
    );
  }

  results.ai = { keyPresent: true, keyPrefix: apiKey.substring(0, 10) + "..." };

  // Test the actual API connection with a minimal call
  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 16,
      messages: [{ role: "user", content: "Say hi in one word." }],
    });

    const text =
      response.content[0]?.type === "text" ? response.content[0].text : "";
    results.ai = {
      ...results.ai as Record<string, unknown>,
      connected: true,
      model: response.model,
      response: text,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    results.status = "error";
    results.ai = {
      ...results.ai as Record<string, unknown>,
      connected: false,
      error: errMsg,
    };
    return NextResponse.json(results, { status: 503 });
  }

  return NextResponse.json(results);
}
