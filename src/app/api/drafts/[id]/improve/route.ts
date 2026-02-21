import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateDraft } from "@/lib/ai";

export const maxDuration = 60;

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured. Add it in Vercel → Settings → Environment Variables, then redeploy." },
        { status: 503 }
      );
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const draft = await db.draft.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        assignment: {
          include: {
            course: {
              include: {
                professorProfile: true,
              },
            },
          },
        },
      },
    });

    if (!draft) {
      return NextResponse.json(
        { error: "Draft not found." },
        { status: 404 }
      );
    }

    const { assignment } = draft;

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
      `\n--- EXISTING DRAFT (Version ${draft.version}) — IMPROVE THIS ---\n`,
      draft.content,
      `\n--- END OF EXISTING DRAFT ---`,
      `\nInstruction: Improve the above draft. Strengthen the argument, fix any weaknesses, enhance clarity, and raise the overall quality while preserving the student's voice and intent.`,
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

    // Find the highest version for this assignment to correctly increment
    const latestDraft = await db.draft.findFirst({
      where: {
        assignmentId: assignment.id,
        userId: session.user.id,
      },
      orderBy: { version: "desc" },
      select: { version: true },
    });

    const nextVersion = (latestDraft?.version || 0) + 1;
    const wordCount = content.split(/\s+/).filter(Boolean).length;

    const newDraft = await db.draft.create({
      data: {
        assignmentId: assignment.id,
        userId: session.user.id,
        content,
        version: nextVersion,
        wordCount,
        status: "GENERATED",
      },
    });

    return NextResponse.json({ draft: newDraft }, { status: 201 });
  } catch (error) {
    console.error("Improve draft error:", error);
    return NextResponse.json(
      { error: "Failed to improve draft." },
      { status: 500 }
    );
  }
}
