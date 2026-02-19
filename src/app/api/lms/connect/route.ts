import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { email, lmsType } = await request.json();

    if (!email || !lmsType) {
      return NextResponse.json(
        { error: "Email and lmsType are required." },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    const existing = await db.lmsConnection.findFirst({
      where: { userId: user.id, lmsType },
      select: { id: true },
    });

    let connection;

    if (existing) {
      connection = await db.lmsConnection.update({
        where: { id: existing.id },
        data: {
          status: "ACTIVE",
          accessToken: "pending",
        },
      });
    } else {
      connection = await db.lmsConnection.create({
        data: {
          userId: user.id,
          lmsType,
          status: "ACTIVE",
          accessToken: "pending",
        },
      });
    }

    return NextResponse.json({
      success: true,
      connection: {
        lmsType: connection.lmsType,
        status: "ACTIVE",
      },
    });
  } catch (error) {
    console.error("LMS connect error:", error);
    return NextResponse.json(
      { error: "Failed to connect LMS." },
      { status: 500 }
    );
  }
}
