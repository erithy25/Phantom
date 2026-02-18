import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {
      userId: session.user.id,
    };

    if (courseId) {
      where.courseId = courseId;
    }

    if (status) {
      where.processingStatus = status;
    }

    const lectures = await db.lecture.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            flashcards: true,
            examQuestions: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    const formatted = lectures.map((lecture) => ({
      id: lecture.id,
      title: lecture.title,
      date: lecture.date,
      durationSeconds: lecture.durationSeconds,
      processingStatus: lecture.processingStatus,
      captureMethod: lecture.captureMethod,
      topics: lecture.topics,
      course: lecture.course,
      flashcardCount: lecture._count.flashcards,
      examQuestionCount: lecture._count.examQuestions,
      hasSummary: !!lecture.summary,
      hasTranscript: !!lecture.transcript,
      createdAt: lecture.createdAt,
    }));

    return NextResponse.json({ lectures: formatted });
  } catch (error) {
    console.error("Get lectures error:", error);
    return NextResponse.json(
      { error: "Failed to fetch lectures." },
      { status: 500 }
    );
  }
}
