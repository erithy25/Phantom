import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const [user, courses, upcomingTasks, drafts] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: { name: true },
      }),
      db.course.findMany({
        where: { userId, isActive: true },
        select: { name: true, code: true, currentGrade: true, letterGrade: true, credits: true },
      }),
      db.assignment.findMany({
        where: {
          userId,
          status: { not: "COMPLETED" },
          dueDate: { gte: new Date(), lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
        },
        select: { title: true, dueDate: true, course: { select: { name: true } } },
        orderBy: { dueDate: "asc" },
        take: 5,
      }),
      db.draft.count({ where: { userId, status: "GENERATED" } }),
    ]);

    // If user has no courses or tasks, return a welcome message
    if (courses.length === 0 && upcomingTasks.length === 0) {
      return NextResponse.json({
        insight: `Welcome${user?.name ? `, ${user.name}` : ""}! Add your courses and tasks to get personalized AI insights here.`,
      });
    }

    // Build context for AI
    const context = [];
    if (courses.length > 0) {
      context.push(`Courses: ${courses.map(c => `${c.name} (${c.code})${c.letterGrade ? ` - ${c.letterGrade}` : ""}`).join(", ")}`);
    }
    if (upcomingTasks.length > 0) {
      context.push(`Upcoming tasks: ${upcomingTasks.map(t => `${t.title} (${t.course.name}, due ${t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "soon"})`).join(", ")}`);
    }
    if (drafts > 0) {
      context.push(`${drafts} draft(s) ready for review.`);
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "" });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 200,
      system: `Generate one short, personalized academic insight based on the student's data. Keep it to 1-2 natural sentences. Be specific — reference actual course names, deadlines, or grades. No asterisks, no markdown, no special characters. Just clean, plain text that sounds like a smart friend giving a quick heads-up.`,
      messages: [
        {
          role: "user",
          content: `Student context:\n${context.join("\n")}`,
        },
      ],
    });

    const text = response.content[0]?.type === "text" ? response.content[0].text : null;

    return NextResponse.json({ insight: text });
  } catch (error) {
    console.error("Insight generation error:", error);
    return NextResponse.json({ insight: null });
  }
}
