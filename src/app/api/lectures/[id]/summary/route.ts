import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateLectureSummary } from "@/lib/ai";

export const maxDuration = 60;

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured. Add it in Vercel → Settings → Environment Variables, then redeploy." },
        { status: 503 }
      );
    }

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

    if (lecture.summary) {
      return NextResponse.json({
        lecture: {
          id: lecture.id,
          title: lecture.title,
          course: lecture.course,
        },
        summary: lecture.summary,
        topics: lecture.topics,
        cached: true,
      });
    }

    if (!lecture.transcript) {
      return NextResponse.json(
        {
          error:
            "No transcript available. The lecture must be processed before a summary can be generated.",
          processingStatus: lecture.processingStatus,
        },
        { status: 400 }
      );
    }

    const result = await generateLectureSummary(
      lecture.transcript,
      lecture.course.name
    );

    await db.lecture.update({
      where: { id: lecture.id },
      data: {
        summary: result.summary,
        topics: result.topics,
        processingStatus: "COMPLETED",
      },
    });

    if (result.flashcards.length > 0) {
      await db.flashcard.createMany({
        data: result.flashcards.map((fc) => ({
          lectureId: lecture.id,
          courseId: lecture.courseId,
          userId: session.user.id,
          question: fc.question,
          answer: fc.answer,
        })),
      });
    }

    if (result.examQuestions.length > 0) {
      await db.examQuestion.createMany({
        data: result.examQuestions.map((eq) => ({
          lectureId: lecture.id,
          question: eq.question,
          answer: eq.answer,
          topic: eq.topic,
        })),
      });
    }

    return NextResponse.json({
      lecture: {
        id: lecture.id,
        title: lecture.title,
        course: lecture.course,
      },
      summary: result.summary,
      topics: result.topics,
      flashcardsGenerated: result.flashcards.length,
      examQuestionsGenerated: result.examQuestions.length,
      cached: false,
    });
  } catch (error) {
    console.error("Lecture summary error:", error);
    return NextResponse.json(
      { error: "Failed to generate lecture summary." },
      { status: 500 }
    );
  }
}
