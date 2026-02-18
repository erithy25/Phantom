import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const history = await db.gpaHistory.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
    });

    let cumulativeGpa = 0;
    let cumulativeCredits = 0;

    const enrichedHistory = history.map((entry) => {
      cumulativeCredits += entry.credits;
      const cumulativeQualityPoints =
        cumulativeGpa * (cumulativeCredits - entry.credits) +
        entry.gpa * entry.credits;

      cumulativeGpa =
        cumulativeCredits > 0
          ? Math.round((cumulativeQualityPoints / cumulativeCredits) * 100) /
            100
          : 0;

      return {
        id: entry.id,
        semester: entry.semester,
        semesterGpa: entry.gpa,
        credits: entry.credits,
        cumulativeGpa,
        cumulativeCredits,
        createdAt: entry.createdAt,
      };
    });

    return NextResponse.json({
      history: enrichedHistory,
      currentCumulativeGpa: cumulativeGpa,
      totalCredits: cumulativeCredits,
    });
  } catch (error) {
    console.error("GPA history error:", error);
    return NextResponse.json(
      { error: "Failed to fetch GPA history." },
      { status: 500 }
    );
  }
}
