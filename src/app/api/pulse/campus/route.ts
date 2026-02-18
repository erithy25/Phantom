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

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { universityId: true },
    });

    if (!user?.universityId) {
      return NextResponse.json(
        { error: "No university associated with your account." },
        { status: 400 }
      );
    }

    const university = await db.university.findUnique({
      where: { id: user.universityId },
      select: {
        id: true,
        name: true,
        domain: true,
        studentCount: true,
        logoUrl: true,
      },
    });

    const latestPulse = await db.campusPulse.findFirst({
      where: { universityId: user.universityId },
      orderBy: { date: "desc" },
    });

    const totalPhantomUsers = await db.user.count({
      where: { universityId: user.universityId },
    });

    const activeUsersLast7Days = await db.user.count({
      where: {
        universityId: user.universityId,
        updatedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    const popularCourses = await db.course.groupBy({
      by: ["code", "name"],
      where: {
        user: { universityId: user.universityId },
        isActive: true,
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });

    const totalDraftsGenerated = await db.draft.count({
      where: {
        user: { universityId: user.universityId },
      },
    });

    const totalFlashcardsCreated = await db.flashcard.count({
      where: {
        user: { universityId: user.universityId },
      },
    });

    const totalLecturesProcessed = await db.lecture.count({
      where: {
        user: { universityId: user.universityId },
        processingStatus: "COMPLETED",
      },
    });

    return NextResponse.json({
      university,
      stats: {
        totalPhantomUsers,
        activeUsersLast7Days,
        weeklyGrowth: latestPulse?.weeklyGrowth || 0,
        totalDraftsGenerated,
        totalFlashcardsCreated,
        totalLecturesProcessed,
        additionalStats: latestPulse?.stats || null,
      },
      popularCourses: popularCourses.map((c) => ({
        code: c.code,
        name: c.name,
        studentCount: c._count.id,
      })),
      pulseDate: latestPulse?.date || null,
    });
  } catch (error) {
    console.error("Campus pulse error:", error);
    return NextResponse.json(
      { error: "Failed to fetch campus statistics." },
      { status: 500 }
    );
  }
}
