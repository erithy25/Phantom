import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const email = formData.get("email") as string | null;
    const name = formData.get("name") as string | null;
    const password = formData.get("password") as string | null;
    const photo = formData.get("photo") as File | null;

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: "Email, name, and password are required." },
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

    const hashedPassword = await bcrypt.hash(password, 12);

    await db.user.update({
      where: { email: normalizedEmail },
      data: {
        name,
        hashedPassword,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Setup profile error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
