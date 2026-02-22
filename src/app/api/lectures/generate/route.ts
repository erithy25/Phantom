import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateLectureFromTopic } from "@/lib/ai";

export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { courseId, topic, title } = body;

    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required." }, { status: 400 });
    }
    if (!topic?.trim()) {
      return NextResponse.json({ error: "Topic is required." }, { status: 400 });
    }

    const course = await db.course.findFirst({
      where: { id: courseId, userId: session.user.id },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    // Create lecture record immediately
    const lecture = await db.lecture.create({
      data: {
        courseId,
        userId: session.user.id,
        title: title || topic,
        captureMethod: "GENERATED",
        processingStatus: "PROCESSING",
        transcript: `[Generated from topic: ${topic}]`,
      },
    });

    // Generate full lecture content from the topic
    try {
      const analysis = await generateLectureFromTopic(
        topic,
        course.name,
        course.code,
        course.professorName,
        course.syllabusText
      );

      // Store rich data in topics JSON field
      const topicsData = {
        topics: analysis.topics,
        keyTakeaways: analysis.keyTakeaways || [],
        conceptsExplained: analysis.conceptsExplained || [],
      };

      await db.lecture.update({
        where: { id: lecture.id },
        data: {
          summary: analysis.summary,
          topics: topicsData,
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
      await db.lecture.update({
        where: { id: lecture.id },
        data: { processingStatus: "FAILED" },
      });
      console.error("AI lecture generation error:", aiError);
      return NextResponse.json({
        lecture: { id: lecture.id, title: lecture.title, processingStatus: "FAILED" },
        error: "AI generation failed. Please try again.",
      }, { status: 201 });
    }
  } catch (error) {
    console.error("Generate lecture error:", error);
    return NextResponse.json({ error: "Failed to generate lecture." }, { status: 500 });
  }
}
