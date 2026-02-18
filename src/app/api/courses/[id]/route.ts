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

    const course = await db.course.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        assignments: {
          orderBy: { dueDate: "asc" },
        },
        lectures: {
          orderBy: { date: "desc" },
          select: {
            id: true,
            title: true,
            date: true,
            durationSeconds: true,
            processingStatus: true,
            topics: true,
          },
        },
        professorProfile: true,
        _count: {
          select: {
            assignments: true,
            lectures: true,
            flashcards: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ course });
  } catch (error) {
    console.error("Get course error:", error);
    return NextResponse.json(
      { error: "Failed to fetch course." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingCourse = await db.course.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingCourse) {
      return NextResponse.json(
        { error: "Course not found." },
        { status: 404 }
      );
    }

    const body = await request.json();

    const allowedFields = [
      "name",
      "code",
      "professorName",
      "credits",
      "semester",
      "currentGrade",
      "letterGrade",
      "isActive",
      "syllabusText",
      "semesterProgress",
    ] as const;

    const updateData: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update." },
        { status: 400 }
      );
    }

    const course = await db.course.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ course });
  } catch (error) {
    console.error("Update course error:", error);
    return NextResponse.json(
      { error: "Failed to update course." },
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

    const course = await db.course.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found." },
        { status: 404 }
      );
    }

    await db.course.delete({ where: { id: params.id } });

    return NextResponse.json({
      success: true,
      message: "Course deleted successfully.",
    });
  } catch (error) {
    console.error("Delete course error:", error);
    return NextResponse.json(
      { error: "Failed to delete course." },
      { status: 500 }
    );
  }
}
