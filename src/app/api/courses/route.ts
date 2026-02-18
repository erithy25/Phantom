import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { courseSchema } from "@/lib/validations";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const courses = await db.course.findMany({
      where: { userId: session.user.id },
      include: {
        assignments: {
          select: {
            id: true,
            title: true,
            status: true,
            dueDate: true,
            grade: true,
          },
          orderBy: { dueDate: "asc" },
        },
        _count: {
          select: {
            assignments: true,
            lectures: true,
            flashcards: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error("Get courses error:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = courseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, code, professorName, credits, semester } = validation.data;

    const existingCourse = await db.course.findFirst({
      where: {
        userId: session.user.id,
        code: code.toUpperCase(),
        semester: semester || undefined,
      },
    });

    if (existingCourse) {
      return NextResponse.json(
        { error: "You already have this course registered." },
        { status: 409 }
      );
    }

    const course = await db.course.create({
      data: {
        userId: session.user.id,
        name,
        code: code.toUpperCase(),
        professorName,
        credits,
        semester,
      },
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    console.error("Create course error:", error);
    return NextResponse.json(
      { error: "Failed to create course." },
      { status: 500 }
    );
  }
}
