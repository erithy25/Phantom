import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const activeUsers = await db.user.count({
      where: {
        updatedAt: {
          gte: thirtyMinutesAgo,
        },
      },
    });

    return NextResponse.json({ activeUsers });
  } catch (error) {
    console.error("Active users error:", error);
    return NextResponse.json({ activeUsers: 0 });
  }
}
