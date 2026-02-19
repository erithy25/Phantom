import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const drafts = await db.draft.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        assignment: {
          include: {
            course: {
              select: {
                id: true,
                name: true,
                code: true,
                professorName: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
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
