import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateDraft } from "@/lib/ai";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { assignmentId, prompt, tone } = body;

    if (!assignmentId) {
      return NextResponse.json({ error: "Assignment ID is required." }, { status: 400 });
    }

    const assignment = await db.assignment.findFirst({
      where: { id: assignmentId, userId: session.user.id },
      include: {
        course: {
          include: { professorProfile: true },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
    }

    // Get the latest version number
    const latestDraft = await db.draft.findFirst({
      where: { assignmentId },
      orderBy: { version: "desc" },
      select: { version: true },
    });

    const nextVersion = (latestDraft?.version || 0) + 1;

    // Generate the draft content using AI
    const description = `${assignment.title}\n\n${assignment.description || prompt || "Write a complete draft for this assignment."}`;
    const profProfile = assignment.course.professorProfile ? (assignment.course.professorProfile as Record<string, unknown>) : null;
    const courseCtx = `${assignment.course.name} (${assignment.course.code})`;
    const draftContent = await generateDraft(description, profProfile, courseCtx, tone || "BALANCED");

    const wordCount = draftContent.trim().split(/\s+/).filter(Boolean).length;

    const draft = await db.draft.create({
      data: {
        assignmentId,
        userId: session.user.id,
        content: draftContent,
        version: nextVersion,
        status: "GENERATED",
        wordCount,
      },
      include: {
        assignment: {
          include: {
            course: { select: { name: true, code: true, professorName: true } },
          },
        },
      },
    });

    // Update assignment status
    await db.assignment.update({
      where: { id: assignmentId },
      data: { status: "DRAFT_READY" },
    });

    return NextResponse.json({ draft }, { status: 201 });
  } catch (error) {
    console.error("Generate draft error:", error);
    return NextResponse.json({ error: "Failed to generate draft." }, { status: 500 });
  }
}
