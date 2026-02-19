import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const draft = await db.draft.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      select: {
        id: true,
        assignmentId: true,
      },
    });

    if (!draft) {
      return NextResponse.json(
        { error: "Draft not found." },
        { status: 404 }
      );
    }

    await db.draft.update({
      where: { id: draft.id },
      data: { status: "SUBMITTED" },
    });

    await db.assignment.update({
      where: { id: draft.assignmentId },
      data: { status: "SUBMITTED" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Submit draft error:", error);
    return NextResponse.json(
      { error: "Failed to submit draft." },
      { status: 500 }
    );
  }
}
