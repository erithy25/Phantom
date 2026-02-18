import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { forgotPasswordSchema } from "@/lib/validations";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = forgotPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const email = validation.data.email.toLowerCase();

    const user = await db.user.findUnique({ where: { email } });

    if (user) {
      await db.passwordResetToken.deleteMany({ where: { email } });

      const token = crypto.randomUUID();

      await db.passwordResetToken.create({
        data: {
          email,
          token,
          expires: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      console.log(`[PHANTOM] Password reset token for ${email}: ${token}`);
    }

    return NextResponse.json({
      success: true,
      message:
        "If an account exists with that email, you will receive a password reset link.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
