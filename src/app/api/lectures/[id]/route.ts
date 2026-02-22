import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const lecture = await db.lecture.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
            professorName: true,
          },
        },
        _count: {
          select: {
            flashcards: true,
            examQuestions: true,
          },
        },
      },
    });

    if (!lecture) {
      return NextResponse.json(
        { error: "Lecture not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      lecture: {
        id: lecture.id,
        title: lecture.title,
        date: lecture.date,
        audioUrl: lecture.audioUrl,
        transcript: lecture.transcript,
        summary: lecture.summary,
        durationSeconds: lecture.durationSeconds,
        topics: lecture.topics,
        captureMethod: lecture.captureMethod,
        processingStatus: lecture.processingStatus,
        course: lecture.course,
        flashcardCount: lecture._count.flashcards,
        examQuestionCount: lecture._count.examQuestions,
        createdAt: lecture.createdAt,
        updatedAt: lecture.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get lecture error:", error);
    return NextResponse.json(
      { error: "Failed to fetch lecture." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const lecture = await db.lecture.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!lecture) {
      return NextResponse.json({ error: "Lecture not found." }, { status: 404 });
    }

    await db.lecture.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true, message: "Lecture deleted successfully." });
  } catch (error) {
    console.error("Delete lecture error:", error);
    return NextResponse.json({ error: "Failed to delete lecture." }, { status: 500 });
  }
}
