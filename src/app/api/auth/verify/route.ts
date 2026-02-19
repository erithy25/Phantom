import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySchema } from "@/lib/validations";

const COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 3;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = verifySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, code } = validation.data;
    const normalizedEmail = email.toLowerCase();

    const token = await db.verificationToken.findFirst({
      where: { email: normalizedEmail },
      orderBy: { createdAt: "desc" },
    });

    if (!token) {
      return NextResponse.json(
        { error: "No verification code found. Please request a new one." },
        { status: 400 }
      );
    }

    if (new Date() > token.expires) {
      await db.verificationToken.delete({ where: { id: token.id } });
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    if (token.attempts >= MAX_ATTEMPTS) {
      const cooldownEnds = new Date(
        token.createdAt.getTime() +
          token.attempts * COOLDOWN_SECONDS * 1000
      );

      if (new Date() < cooldownEnds) {
        const remainingSeconds = Math.ceil(
          (cooldownEnds.getTime() - Date.now()) / 1000
        );
        return NextResponse.json(
          {
            error: `Too many failed attempts. Please wait ${remainingSeconds} seconds before trying again.`,
            cooldown: remainingSeconds,
          },
          { status: 429 }
        );
      }
    }

    if (token.code !== code) {
      await db.verificationToken.update({
        where: { id: token.id },
        data: { attempts: { increment: 1 } },
      });

      const attemptsLeft = MAX_ATTEMPTS - (token.attempts + 1);

      if (attemptsLeft <= 0) {
        return NextResponse.json(
          {
            error: `Invalid code. Too many failed attempts. Please wait ${COOLDOWN_SECONDS} seconds.`,
            cooldown: COOLDOWN_SECONDS,
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          error: `Invalid verification code. ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} remaining.`,
        },
        { status: 400 }
      );
    }

    await db.user.update({
      where: { email: normalizedEmail },
      data: {
        emailVerified: new Date(),
        onboardingDone: true,
      },
    });

    await db.verificationToken.delete({ where: { id: token.id } });

    return NextResponse.json({
      success: true,
      message: "Email verified successfully.",
    });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
