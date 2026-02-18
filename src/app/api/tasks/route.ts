import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const courseId = searchParams.get("courseId");
    const dueBefore = searchParams.get("dueBefore");
    const dueAfter = searchParams.get("dueAfter");
    const sort = searchParams.get("sort") || "dueDate";
    const order = searchParams.get("order") || "asc";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

    const where: Prisma.AssignmentWhereInput = {
      userId: session.user.id,
    };

    if (status) {
      const statuses = status.split(",");
      where.status = { in: statuses };
    }

    if (priority) {
      const priorities = priority.split(",");
      where.priority = { in: priorities };
    }

    if (courseId) {
      where.courseId = courseId;
    }

    if (dueBefore || dueAfter) {
      where.dueDate = {};
      if (dueBefore) {
        where.dueDate.lte = new Date(dueBefore);
      }
      if (dueAfter) {
        where.dueDate.gte = new Date(dueAfter);
      }
    }

    const validSortFields: Record<string, string> = {
      dueDate: "dueDate",
      priority: "priority",
      status: "status",
      createdAt: "createdAt",
      title: "title",
    };

    const sortField = validSortFields[sort] || "dueDate";
    const sortOrder = order === "desc" ? "desc" : "asc";

    const [tasks, total] = await Promise.all([
      db.assignment.findMany({
        where,
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
            select: {
              id: true,
              status: true,
              version: true,
              predictedGrade: true,
              createdAt: true,
            },
            orderBy: { version: "desc" },
            take: 1,
          },
        },
        orderBy: { [sortField]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.assignment.count({ where }),
    ]);

    const enrichedTasks = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      status: task.status,
      priority: task.priority,
      weight: task.weight,
      maxScore: task.maxScore,
      grade: task.grade,
      estimatedTime: task.estimatedTime,
      gpaImpact: task.gpaImpact,
      course: task.course,
      latestDraft: task.drafts[0] || null,
      hasDraft: task.drafts.length > 0,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    }));

    return NextResponse.json({
      tasks: enrichedTasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get tasks error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks." },
      { status: 500 }
    );
  }
}
