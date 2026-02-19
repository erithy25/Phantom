import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get("domain");

    if (!domain) {
      return NextResponse.json({ count: 0, universityName: null });
    }

    const university = await db.university.findUnique({
      where: { domain },
      select: {
        id: true,
        name: true,
      },
    });

    if (!university) {
      return NextResponse.json({ count: 0, universityName: null });
    }

    const count = await db.user.count({
      where: { universityId: university.id },
    });

    return NextResponse.json({ count, universityName: university.name });
  } catch (error) {
    console.error("Student count error:", error);
    return NextResponse.json({ count: 0, universityName: null });
  }
}
