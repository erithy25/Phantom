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

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await db.draft.findFirst({
      where: { id: params.id, userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Draft not found." }, { status: 404 });
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};
    if (body.content !== undefined) {
      updateData.content = body.content;
      updateData.wordCount = body.content.trim().split(/\s+/).filter(Boolean).length;
    }
    if (body.status !== undefined) updateData.status = body.status;

    const draft = await db.draft.update({ where: { id: params.id }, data: updateData });
    return NextResponse.json({ draft });
  } catch (error) {
    console.error("Update draft error:", error);
    return NextResponse.json({ error: "Failed to update draft." }, { status: 500 });
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

    const draft = await db.draft.findFirst({
      where: { id: params.id, userId: session.user.id },
    });
    if (!draft) {
      return NextResponse.json({ error: "Draft not found." }, { status: 404 });
    }

    await db.draft.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete draft error:", error);
    return NextResponse.json({ error: "Failed to delete draft." }, { status: 500 });
  }
}
