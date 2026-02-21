import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateGpaAdvice } from "@/lib/ai";

export async function GET() {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured. Add it in Vercel → Settings → Environment Variables, then redeploy." },
        { status: 503 }
      );
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const courses = await db.course.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      include: {
        assignments: {
          where: {
            status: { not: "COMPLETED" },
            dueDate: { gte: new Date() },
          },
          orderBy: { dueDate: "asc" },
          select: {
            title: true,
            weight: true,
            gpaImpact: true,
          },
        },
      },
    });

    if (courses.length === 0) {
      return NextResponse.json({
        advice:
          "Add your courses to Phantom first so I can analyze your academic performance and provide personalized GPA optimization strategies.",
      });
    }

    const courseData = courses.map((course) => ({
      name: course.name,
      currentGrade: course.currentGrade,
      credits: course.credits,
      upcomingAssignments: course.assignments.map((a) => ({
        title: a.title,
        weight: a.weight,
        gpaImpact: a.gpaImpact,
      })),
    }));

    const advice = await generateGpaAdvice(courseData);

    return NextResponse.json({ advice });
  } catch (error) {
    console.error("GPA advisor error:", error);
    return NextResponse.json(
      { error: "Failed to generate GPA advice." },
      { status: 500 }
    );
  }
}
