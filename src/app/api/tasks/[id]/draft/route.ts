import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateDraft } from "@/lib/ai";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assignment = await db.assignment.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      select: { id: true },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found." },
        { status: 404 }
      );
    }

    const drafts = await db.draft.findMany({
      where: {
        assignmentId: params.id,
        userId: session.user.id,
      },
      orderBy: { version: "desc" },
    });

    return NextResponse.json({ drafts });
  } catch (error) {
    console.error("Get drafts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch drafts." },
      { status: 500 }
    );
  }
}

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assignment = await db.assignment.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        course: {
          include: {
            professorProfile: true,
          },
        },
        drafts: {
          orderBy: { version: "desc" },
          take: 1,
          select: { version: true },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found." },
        { status: 404 }
      );
    }

    if (!assignment.description && !assignment.title) {
      return NextResponse.json(
        {
          error:
            "Assignment needs a description before a draft can be generated.",
        },
        { status: 400 }
      );
    }

    const userSettings = await db.userSettings.findUnique({
      where: { userId: session.user.id },
      select: { writingTone: true },
    });

    const professorProfile = assignment.course.professorProfile;

    const courseContext = [
      `Course: ${assignment.course.name} (${assignment.course.code})`,
      assignment.course.professorName
        ? `Professor: ${assignment.course.professorName}`
        : null,
      assignment.course.syllabusText
        ? `Syllabus context: ${assignment.course.syllabusText.substring(0, 2000)}`
        : null,
    ]
      .filter(Boolean)
      .join("\n");

    const assignmentDescription = [
      `Title: ${assignment.title}`,
      assignment.description
        ? `Description: ${assignment.description}`
        : null,
      assignment.maxScore ? `Max Score: ${assignment.maxScore}` : null,
      assignment.weight ? `Weight: ${assignment.weight}%` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const content = await generateDraft(
      assignmentDescription,
      professorProfile
        ? {
            styleModel: professorProfile.styleModel,
            gradingPatterns: professorProfile.gradingPatterns,
            preferences: professorProfile.preferences,
            emphasisTopics: professorProfile.emphasisTopics,
          }
        : null,
      courseContext,
      userSettings?.writingTone || "BALANCED"
    );

    const nextVersion = (assignment.drafts[0]?.version || 0) + 1;
    const wordCount = content.split(/\s+/).filter(Boolean).length;

    const draft = await db.draft.create({
      data: {
        assignmentId: assignment.id,
        userId: session.user.id,
        content,
        version: nextVersion,
        wordCount,
        status: "GENERATED",
      },
    });

    if (assignment.status === "NOT_STARTED") {
      await db.assignment.update({
        where: { id: assignment.id },
        data: { status: "IN_PROGRESS" },
      });
    }

    return NextResponse.json({ draft }, { status: 201 });
  } catch (error) {
    console.error("Generate draft error:", error);
    return NextResponse.json(
      { error: "Failed to generate draft." },
      { status: 500 }
    );
  }
}
