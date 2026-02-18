import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if ((session.user as any).id === params.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account from admin panel" },
        { status: 400 }
      );
    }

    const target = await db.user.findUnique({
      where: { id: params.id },
      select: { name: true, email: true },
    });

    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await db.user.delete({
      where: { id: params.id },
    });

    await db.activity.create({
      data: {
        userId: (session.user as any).id,
        type: "USER_DELETED",
        message: `Deleted user ${target.name || target.email}`,
        metadata: { deletedUserId: params.id, deletedEmail: target.email },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { role } = body;

    if (role && !["USER", "ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    if ((session.user as any).id === params.id && role === "USER") {
      return NextResponse.json(
        { error: "Cannot remove your own admin role" },
        { status: 400 }
      );
    }

    const user = await db.user.update({
      where: { id: params.id },
      data: { ...(role && { role }) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    await db.activity.create({
      data: {
        userId: (session.user as any).id,
        type: "ROLE_CHANGE",
        message: `Changed role for ${user.name || user.email} to ${role}`,
        metadata: { targetUserId: params.id, newRole: role },
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
