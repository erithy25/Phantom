import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getGpaFromLetter, getLetterGrade } from "@/lib/utils";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const [
      courses,
      upcomingTasks,
      readyDrafts,
      recentLectures,
      unreadNotifications,
      conversations,
    ] = await Promise.all([
      db.course.findMany({
        where: { userId, isActive: true },
        select: {
          id: true,
          name: true,
          code: true,
          credits: true,
          currentGrade: true,
          letterGrade: true,
          semesterProgress: true,
        },
      }),
      db.assignment.findMany({
        where: {
          userId,
          status: { not: "COMPLETED" },
          dueDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          course: { select: { name: true, code: true } },
        },
        orderBy: { dueDate: "asc" },
      }),
      db.draft.count({
        where: {
          userId,
          status: "GENERATED",
        },
      }),
      db.lecture.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          date: true,
          processingStatus: true,
          course: { select: { name: true, code: true } },
        },
      }),
      db.notification.count({
        where: { userId, isRead: false },
      }),
      db.conversation.count({
        where: { userId },
      }),
    ]);

    const gradedCourses = courses.filter(
      (c) => c.currentGrade !== null || c.letterGrade !== null
    );

    let gpa = 0;
    let totalGradedCredits = 0;

    if (gradedCourses.length > 0) {
      let totalQualityPoints = 0;

      for (const course of gradedCourses) {
        const letter =
          course.letterGrade ||
          (course.currentGrade !== null
            ? getLetterGrade(course.currentGrade)
            : "F");

        const gradePoints = getGpaFromLetter(letter);
        totalQualityPoints += gradePoints * course.credits;
        totalGradedCredits += course.credits;
      }

      gpa =
        totalGradedCredits > 0
          ? Math.round((totalQualityPoints / totalGradedCredits) * 100) / 100
          : 0;
    }

    const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);
    const avgProgress =
      courses.length > 0
        ? Math.round(
            courses.reduce((sum, c) => sum + c.semesterProgress, 0) /
              courses.length
          )
        : 0;

    const tasksDueToday = upcomingTasks.filter((t) => {
      if (!t.dueDate) return false;
      const today = new Date();
      return (
        t.dueDate.getFullYear() === today.getFullYear() &&
        t.dueDate.getMonth() === today.getMonth() &&
        t.dueDate.getDate() === today.getDate()
      );
    });

    const tasksDueThisWeek = upcomingTasks.length;

    const overdueTasks = await db.assignment.count({
      where: {
        userId,
        status: { not: "COMPLETED" },
        dueDate: { lt: new Date() },
      },
    });

    return NextResponse.json({
      gpa: {
        current: gpa,
        totalCredits,
        gradedCredits: totalGradedCredits,
      },
      courses: {
        total: courses.length,
        avgProgress,
        list: courses.map((c) => ({
          id: c.id,
          name: c.name,
          code: c.code,
          credits: c.credits,
          currentGrade: c.currentGrade,
          letterGrade: c.letterGrade,
          semesterProgress: c.semesterProgress,
        })),
      },
      tasks: {
        dueToday: tasksDueToday.length,
        dueThisWeek: tasksDueThisWeek,
        overdue: overdueTasks,
        upcoming: upcomingTasks.map((t) => ({
          id: t.id,
          title: t.title,
          dueDate: t.dueDate,
          status: t.status,
          priority: t.priority,
          course: t.course,
        })),
      },
      drafts: {
        ready: readyDrafts,
      },
      lectures: {
        recent: recentLectures,
      },
      notifications: {
        unread: unreadNotifications,
      },
      conversations: {
        total: conversations,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics." },
      { status: 500 }
    );
  }
}
