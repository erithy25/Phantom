import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateLectureSummary } from "@/lib/ai";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { courseId, title, notes } = body;

    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required." }, { status: 400 });
    }
    if (!notes?.trim()) {
      return NextResponse.json({ error: "Notes content is required." }, { status: 400 });
    }

    const course = await db.course.findFirst({
      where: { id: courseId, userId: session.user.id },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    // Create lecture record
    const lecture = await db.lecture.create({
      data: {
        courseId,
        userId: session.user.id,
        title: title || `Notes ${new Date().toLocaleDateString()}`,
        captureMethod: "TEXT",
        processingStatus: "PROCESSING",
        transcript: notes,
      },
    });

    // Process with AI
    try {
      const analysis = await generateLectureSummary(notes, course.name);

      // Update lecture with analysis results
      await db.lecture.update({
        where: { id: lecture.id },
        data: {
          summary: analysis.summary,
          topics: analysis.topics,
          processingStatus: "COMPLETED",
        },
      });

      // Create flashcards
      if (analysis.flashcards?.length > 0) {
        await db.flashcard.createMany({
          data: analysis.flashcards.map((fc: { question: string; answer: string }) => ({
            lectureId: lecture.id,
            courseId,
            userId: session.user.id,
            question: fc.question,
            answer: fc.answer,
            difficulty: "MEDIUM",
          })),
        });
      }

      // Create exam questions
      if (analysis.examQuestions?.length > 0) {
        await db.examQuestion.createMany({
          data: analysis.examQuestions.map((eq: { question: string; answer: string; topic?: string }) => ({
            lectureId: lecture.id,
            courseId,
            userId: session.user.id,
            question: eq.question,
            answer: eq.answer,
            topic: eq.topic || null,
          })),
        });
      }

      return NextResponse.json({
        lecture: { id: lecture.id, title: lecture.title, processingStatus: "COMPLETED" },
        summary: analysis.summary,
        flashcardCount: analysis.flashcards?.length || 0,
        examQuestionCount: analysis.examQuestions?.length || 0,
      }, { status: 201 });
    } catch (aiError) {
      // Mark as failed if AI processing fails
      await db.lecture.update({
        where: { id: lecture.id },
        data: { processingStatus: "FAILED" },
      });
      console.error("AI analysis error:", aiError);
      return NextResponse.json({
        lecture: { id: lecture.id, title: lecture.title, processingStatus: "FAILED" },
        error: "AI analysis failed but notes were saved.",
      }, { status: 201 });
    }
  } catch (error) {
    console.error("Create lecture from notes error:", error);
    return NextResponse.json({ error: "Failed to process notes." }, { status: 500 });
  }
}
