import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOpenAIClient } from "@/lib/ai";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required." }, { status: 400 });
    }

    const course = await db.course.findFirst({
      where: { id: courseId, userId: session.user.id },
      include: {
        assignments: { select: { title: true } },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    const existingTitles = course.assignments.map((a) => a.title);

    const response = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 2048,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `You generate realistic university assignments for a course. Return valid JSON only.

Generate 5-8 typical assignments a student would have for this type of course in a semester. Include a mix of:
- Essays/papers
- Problem sets/homework
- Midterm and final exams
- Presentations or projects
- Weekly reading responses or quizzes

For each assignment, provide:
- title: specific assignment name
- description: brief description of what's expected
- dueDate: ISO date string spread across the semester (from now until 4 months out)
- priority: "HIGH", "MEDIUM", or "LOW"
- estimatedTime: minutes to complete (realistic)
- weight: percentage of final grade (all should add up to ~100)

Response format:
{"assignments": [{"title": "...", "description": "...", "dueDate": "...", "priority": "...", "estimatedTime": 120, "weight": 10}]}

Do NOT generate assignments with these titles (already exist): ${existingTitles.join(", ") || "none"}`,
        },
        {
          role: "user",
          content: `Course: ${course.name} (${course.code})${course.professorName ? `, Professor: ${course.professorName}` : ""}${course.syllabusText ? `\n\nSyllabus:\n${course.syllabusText.substring(0, 2000)}` : ""}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content || "";

    let assignments;
    try {
      const parsed = JSON.parse(content);
      assignments = parsed.assignments || parsed;
    } catch {
      // Try to extract JSON from the response
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        assignments = parsed.assignments || [parsed];
      } else {
        return NextResponse.json({ error: "Failed to parse AI response." }, { status: 500 });
      }
    }

    if (!Array.isArray(assignments) || assignments.length === 0) {
      return NextResponse.json({ error: "No assignments generated." }, { status: 500 });
    }

    // Create the assignments in DB
    const created = await Promise.all(
      assignments.map((a: { title: string; description?: string; dueDate?: string; priority?: string; estimatedTime?: number; weight?: number }) =>
        db.assignment.create({
          data: {
            userId: session.user.id,
            courseId: course.id,
            title: a.title,
            description: a.description || null,
            dueDate: a.dueDate ? new Date(a.dueDate) : null,
            priority: a.priority || "MEDIUM",
            status: "NOT_STARTED",
            estimatedTime: a.estimatedTime || null,
            weight: a.weight || null,
          },
        })
      )
    );

    return NextResponse.json({ tasks: created, count: created.length }, { status: 201 });
  } catch (error) {
    console.error("Generate tasks error:", error);
    return NextResponse.json({ error: "Failed to generate tasks." }, { status: 500 });
  }
}
