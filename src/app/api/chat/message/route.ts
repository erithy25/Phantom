import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { chatMessageSchema } from "@/lib/validations";
import { generateChatResponse } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = chatMessageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { message, conversationId } = validation.data;

    const courses = await db.course.findMany({
      where: { userId: session.user.id, isActive: true },
      select: {
        name: true,
        code: true,
        professorName: true,
        currentGrade: true,
        letterGrade: true,
      },
    });

    const recentLectures = await db.lecture.findMany({
      where: { userId: session.user.id },
      orderBy: { date: "desc" },
      take: 5,
      select: {
        title: true,
        summary: true,
        course: { select: { name: true } },
      },
    });

    const upcomingAssignments = await db.assignment.findMany({
      where: {
        userId: session.user.id,
        status: { not: "COMPLETED" },
        dueDate: { gte: new Date() },
      },
      orderBy: { dueDate: "asc" },
      take: 10,
      select: {
        title: true,
        dueDate: true,
        status: true,
        course: { select: { name: true } },
      },
    });

    let conversation;

    if (conversationId) {
      conversation = await db.conversation.findFirst({
        where: {
          id: conversationId,
          userId: session.user.id,
        },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            take: 50,
          },
        },
      });

      if (!conversation) {
        return NextResponse.json(
          { error: "Conversation not found." },
          { status: 404 }
        );
      }
    } else {
      const title =
        message.length > 50 ? message.substring(0, 50) + "..." : message;
      conversation = await db.conversation.create({
        data: {
          userId: session.user.id,
          title,
          messages: {
            create: [],
          },
        },
        include: { messages: true },
      });
    }

    await db.message.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: message,
      },
    });

    const gpaData = await db.course.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
        currentGrade: { not: null },
      },
      select: { currentGrade: true, credits: true },
    });

    let currentGpa: number | undefined;
    if (gpaData.length > 0) {
      const totalCredits = gpaData.reduce((sum, c) => sum + c.credits, 0);
      if (totalCredits > 0) {
        const totalPoints = gpaData.reduce((sum, c) => {
          const grade = c.currentGrade || 0;
          const gpaPoint = grade >= 93 ? 4.0 : grade >= 90 ? 3.7 : grade >= 87 ? 3.3 : grade >= 83 ? 3.0 : grade >= 80 ? 2.7 : grade >= 77 ? 2.3 : grade >= 73 ? 2.0 : grade >= 70 ? 1.7 : grade >= 67 ? 1.3 : grade >= 63 ? 1.0 : grade >= 60 ? 0.7 : 0.0;
          return sum + c.credits * gpaPoint;
        }, 0);
        currentGpa = Math.round((totalPoints / totalCredits) * 100) / 100;
      }
    }

    const conversationHistory = conversation.messages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    let aiStream: ReadableStream;
    try {
      aiStream = await generateChatResponse(message, {
        studentName: session.user.name || undefined,
        courses: courses.map((c) => ({
          name: c.name,
          code: c.code,
          professorName: c.professorName || undefined,
          currentGrade: c.currentGrade || undefined,
          letterGrade: c.letterGrade || undefined,
        })),
        recentLectures: recentLectures.map((l) => ({
          courseName: l.course.name,
          title: l.title || undefined,
          summary: l.summary || undefined,
        })),
        upcomingAssignments: upcomingAssignments.map((a) => ({
          title: a.title,
          courseName: a.course.name,
          dueDate: a.dueDate?.toISOString(),
          status: a.status,
        })),
        gpa: currentGpa,
        conversationHistory,
      });
    } catch (aiError) {
      console.error("AI generation error:", aiError);
      return NextResponse.json(
        { error: "AI service is currently unavailable. Please check that the API key is configured." },
        { status: 503 }
      );
    }

    // Create a pass-through stream that collects chunks for DB save
    // This avoids using tee() which can cause issues in serverless
    const chunks: string[] = [];
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const convId = conversation.id;

    const responseStream = new ReadableStream({
      async start(controller) {
        const reader = aiStream.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const text = decoder.decode(value, { stream: true });
            chunks.push(text);
            controller.enqueue(encoder.encode(text));
          }
          controller.close();

          // Save the complete response to DB after streaming finishes
          const fullResponse = chunks.join("");
          if (fullResponse.trim()) {
            await db.message.create({
              data: {
                conversationId: convId,
                role: "assistant",
                content: fullResponse,
              },
            });
            await db.conversation.update({
              where: { id: convId },
              data: { updatedAt: new Date() },
            });
          }
        } catch (err) {
          console.error("Stream error:", err);
          controller.close();
        }
      },
    });

    return new Response(responseStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "X-Conversation-Id": conversation.id,
        "Cache-Control": "no-cache, no-store",
      },
    });
  } catch (error) {
    console.error("Chat message error:", error);
    return NextResponse.json(
      { error: "Failed to process message." },
      { status: 500 }
    );
  }
}
