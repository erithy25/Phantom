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

    let settings = await db.userSettings.findUnique({
      where: { userId: session.user.id },
    });

    if (!settings) {
      settings = await db.userSettings.create({
        data: { userId: session.user.id },
      });
    }

    return NextResponse.json({
      preferences: {
        notificationAlerts: settings.notificationAlerts,
        notificationDrafts: settings.notificationDrafts,
        notificationInsights: settings.notificationInsights,
        notificationLectures: settings.notificationLectures,
        notificationSocial: settings.notificationSocial,
        pushAlerts: settings.pushAlerts,
        pushDrafts: settings.pushDrafts,
        pushInsights: settings.pushInsights,
        pushSocial: settings.pushSocial,
        quietHoursStart: settings.quietHoursStart,
        quietHoursEnd: settings.quietHoursEnd,
        doNotDisturb: settings.doNotDisturb,
      },
    });
  } catch (error) {
    console.error("Get notification preferences error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification preferences." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const allowedFields = [
      "notificationAlerts",
      "notificationDrafts",
      "notificationInsights",
      "notificationLectures",
      "notificationSocial",
      "pushAlerts",
      "pushDrafts",
      "pushInsights",
      "pushSocial",
      "quietHoursStart",
      "quietHoursEnd",
      "doNotDisturb",
    ] as const;

    const updateData: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === "quietHoursStart" || field === "quietHoursEnd") {
          if (body[field] !== null && typeof body[field] !== "string") {
            return NextResponse.json(
              { error: `${field} must be a string (HH:MM format) or null.` },
              { status: 400 }
            );
          }
          updateData[field] = body[field];
        } else if (typeof body[field] !== "boolean") {
          return NextResponse.json(
            { error: `${field} must be a boolean.` },
            { status: 400 }
          );
        } else {
          updateData[field] = body[field];
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update." },
        { status: 400 }
      );
    }

    const settings = await db.userSettings.upsert({
      where: { userId: session.user.id },
      update: updateData,
      create: {
        userId: session.user.id,
        ...updateData,
      },
    });

    return NextResponse.json({
      preferences: {
        notificationAlerts: settings.notificationAlerts,
        notificationDrafts: settings.notificationDrafts,
        notificationInsights: settings.notificationInsights,
        notificationLectures: settings.notificationLectures,
        notificationSocial: settings.notificationSocial,
        pushAlerts: settings.pushAlerts,
        pushDrafts: settings.pushDrafts,
        pushInsights: settings.pushInsights,
        pushSocial: settings.pushSocial,
        quietHoursStart: settings.quietHoursStart,
        quietHoursEnd: settings.quietHoursEnd,
        doNotDisturb: settings.doNotDisturb,
      },
    });
  } catch (error) {
    console.error("Update notification preferences error:", error);
    return NextResponse.json(
      { error: "Failed to update notification preferences." },
      { status: 500 }
    );
  }
}
