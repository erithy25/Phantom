import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validations";
import { lookupUniversity } from "@/lib/universities";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const rateLimit = checkRateLimit(`register:${ip}`, 5, 60 * 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "Too many registration attempts. Please try again later.",
          resetIn: Math.ceil(rateLimit.resetIn / 1000),
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const email = validation.data.email.toLowerCase();

    const universityInfo = lookupUniversity(email);
    if (!universityInfo) {
      return NextResponse.json(
        { error: "Please use a valid university email address (.edu)." },
        { status: 400 }
      );
    }

    let university = await db.university.findUnique({
      where: { domain: universityInfo.domain },
    });

    if (!university) {
      university = await db.university.create({
        data: {
          name: universityInfo.name,
          domain: universityInfo.domain,
          lmsType: universityInfo.lmsType,
        },
      });
    }

    let user = await db.user.findUnique({ where: { email } });

    if (!user) {
      user = await db.user.create({
        data: {
          email,
          universityId: university.id,
        },
      });
    }

    await db.verificationToken.deleteMany({
      where: { email },
    });

    const code = crypto.randomInt(100000, 999999).toString();

    await db.verificationToken.create({
      data: {
        email,
        code,
        expires: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    await sendVerificationEmail(email, code);

    return NextResponse.json({
      success: true,
      message: "Verification code sent",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
