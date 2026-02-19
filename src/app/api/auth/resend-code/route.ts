import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email." },
        { status: 404 }
      );
    }

    await db.verificationToken.deleteMany({
      where: { email: normalizedEmail },
    });

    const code = crypto.randomInt(100000, 999999).toString();

    await db.verificationToken.create({
      data: {
        email: normalizedEmail,
        code,
        expires: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    await sendVerificationEmail(normalizedEmail, code);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Resend code error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
