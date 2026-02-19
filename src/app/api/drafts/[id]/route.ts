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

    const draft = await db.draft.findFirst({
      where: {
        id: params.id,
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
    });

    if (!draft) {
      return NextResponse.json(
        { error: "Draft not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ draft });
  } catch (error) {
    console.error("Get draft error:", error);
    return NextResponse.json(
      { error: "Failed to fetch draft." },
      { status: 500 }
    );
  }
}
