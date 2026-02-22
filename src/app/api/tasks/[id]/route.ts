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

    const task = await db.assignment.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
            professorName: true,
          },
        },
        drafts: {
          orderBy: { version: "desc" },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Get task error:", error);
    return NextResponse.json(
      { error: "Failed to fetch task." },
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

    const existing = await db.assignment.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Task not found." },
        { status: 404 }
      );
    }

    const body = await request.json();

    const allowedFields = [
      "status",
      "priority",
      "title",
      "description",
      "dueDate",
      "estimatedTime",
      "grade",
    ] as const;

    const validStatuses = [
      "NOT_STARTED",
      "IN_PROGRESS",
      "COMPLETED",
      "OVERDUE",
    ];
    const validPriorities = ["LOW", "MEDIUM", "HIGH"];

    const updateData: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === "status" && !validStatuses.includes(body[field])) {
          return NextResponse.json(
            { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
            { status: 400 }
          );
        }
        if (field === "priority" && !validPriorities.includes(body[field])) {
          return NextResponse.json(
            { error: `Invalid priority. Must be one of: ${validPriorities.join(", ")}` },
            { status: 400 }
          );
        }
        if (field === "dueDate") {
          updateData[field] = new Date(body[field]);
        } else {
          updateData[field] = body[field];
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update." },
        { status: 400 }
      );
    }

    const task = await db.assignment.update({
      where: { id: params.id },
      data: updateData,
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Update task error:", error);
    return NextResponse.json(
      { error: "Failed to update task." },
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

    const task = await db.assignment.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found." },
        { status: 404 }
      );
    }

    await db.assignment.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true, message: "Task deleted successfully." });
  } catch (error) {
    console.error("Delete task error:", error);
    return NextResponse.json(
      { error: "Failed to delete task." },
      { status: 500 }
    );
  }
}
