import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateInsight } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const [user, courses, upcomingTasks] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: { name: true },
      }),
      db.course.findMany({
        where: { userId, isActive: true },
        select: { name: true, code: true, currentGrade: true, letterGrade: true, credits: true },
      }),
      db.assignment.findMany({
        where: {
          userId,
          status: { not: "COMPLETED" },
          dueDate: { gte: new Date(), lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
        },
        select: { title: true, dueDate: true, status: true, course: { select: { name: true } } },
        orderBy: { dueDate: "asc" },
        take: 5,
      }),
    ]);

    // If user has no courses or tasks, return a welcome message
    if (courses.length === 0 && upcomingTasks.length === 0) {
      return NextResponse.json({
        insight: `Welcome${user?.name ? `, ${user.name}` : ""}! Add your courses and tasks to get personalized AI insights here.`,
      });
    }

    // Compute GPA for context
    const coursesWithGrades = courses.filter(c => c.currentGrade !== null);
    let gpa: number | undefined;
    if (coursesWithGrades.length > 0) {
      const totalCredits = coursesWithGrades.reduce((sum, c) => sum + c.credits, 0);
      if (totalCredits > 0) {
        const totalPoints = coursesWithGrades.reduce((sum, c) => {
          const grade = c.currentGrade || 0;
          const gpaPoint = grade >= 93 ? 4.0 : grade >= 90 ? 3.7 : grade >= 87 ? 3.3 : grade >= 83 ? 3.0 : grade >= 80 ? 2.7 : grade >= 77 ? 2.3 : grade >= 73 ? 2.0 : grade >= 70 ? 1.7 : grade >= 67 ? 1.3 : grade >= 63 ? 1.0 : grade >= 60 ? 0.7 : 0.0;
          return sum + c.credits * gpaPoint;
        }, 0);
        gpa = Math.round((totalPoints / totalCredits) * 100) / 100;
      }
    }

    const insight = await generateInsight({
      studentName: user?.name || undefined,
      courses: courses.map(c => ({
        name: c.name,
        code: c.code,
        currentGrade: c.currentGrade || undefined,
        letterGrade: c.letterGrade || undefined,
      })),
      upcomingAssignments: upcomingTasks.map(t => ({
        title: t.title,
        courseName: t.course.name,
        dueDate: t.dueDate?.toISOString(),
        status: t.status,
      })),
      gpa,
    });

    return NextResponse.json({ insight });
  } catch (error) {
    console.error("Insight generation error:", error);
    return NextResponse.json({ insight: null });
  }
}
