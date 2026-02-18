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
      select: {
        id: true,
        title: true,
        processingStatus: true,
        course: {
          select: { name: true, code: true },
        },
      },
    });

    if (!lecture) {
      return NextResponse.json(
        { error: "Lecture not found." },
        { status: 404 }
      );
    }

    if (lecture.processingStatus !== "COMPLETED") {
      return NextResponse.json(
        {
          error: "Lecture has not been processed yet. Flashcards are not available.",
          processingStatus: lecture.processingStatus,
        },
        { status: 400 }
      );
    }

    const flashcards = await db.flashcard.findMany({
      where: {
        lectureId: params.id,
        userId: session.user.id,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      lecture: {
        id: lecture.id,
        title: lecture.title,
        course: lecture.course,
      },
      flashcards,
      total: flashcards.length,
    });
  } catch (error) {
    console.error("Get flashcards error:", error);
    return NextResponse.json(
      { error: "Failed to fetch flashcards." },
      { status: 500 }
    );
  }
}
