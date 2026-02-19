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

    const assignment = await db.assignment.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found." },
        { status: 404 }
      );
    }

    await db.assignment.update({
      where: { id: params.id },
      data: { status: "SUBMITTED" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Submit task error:", error);
    return NextResponse.json(
      { error: "Failed to submit task." },
      { status: 500 }
    );
  }
}
