import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, dueDate, priority, courseId, estimatedTime } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }

    // Validate course belongs to user if provided
    if (courseId) {
      const course = await db.course.findFirst({
        where: { id: courseId, userId: session.user.id },
      });
      if (!course) {
        return NextResponse.json({ error: "Course not found." }, { status: 404 });
      }
    }

    const task = await db.assignment.create({
      data: {
        userId: session.user.id,
        courseId: courseId || null,
        title: title.trim(),
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || "MEDIUM",
        status: "NOT_STARTED",
        estimatedTime: estimatedTime || null,
      },
      include: {
        course: { select: { id: true, name: true, code: true } },
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("Create task error:", error);
    return NextResponse.json({ error: "Failed to create task." }, { status: 500 });
  }
}
