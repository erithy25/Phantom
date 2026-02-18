import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        university: true,
        lmsConnections: {
          where: { status: "CONNECTED" },
          orderBy: { updatedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    const lmsConnection = user.lmsConnections[0];

    if (!lmsConnection) {
      return NextResponse.json(
        {
          error: "No LMS connection found. Please connect your university LMS first.",
          requiresConnection: true,
        },
        { status: 400 }
      );
    }

    const mockSyncedCourses = [
      {
        lmsCourseId: "lms-101",
        name: "Introduction to Computer Science",
        code: "CS 101",
        professorName: "Dr. Sarah Mitchell",
        credits: 4,
        semester: "Spring 2026",
        currentGrade: 92.5,
        letterGrade: "A-",
        assignments: [
          {
            lmsAssignmentId: "lms-asgn-1",
            title: "Algorithm Analysis Problem Set",
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            maxScore: 100,
            status: "NOT_STARTED",
          },
          {
            lmsAssignmentId: "lms-asgn-2",
            title: "Data Structures Implementation",
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            maxScore: 150,
            status: "NOT_STARTED",
          },
        ],
      },
      {
        lmsCourseId: "lms-201",
        name: "Organic Chemistry II",
        code: "CHEM 201",
        professorName: "Prof. James Weber",
        credits: 3,
        semester: "Spring 2026",
        currentGrade: 87.3,
        letterGrade: "B+",
        assignments: [
          {
            lmsAssignmentId: "lms-asgn-3",
            title: "Reaction Mechanisms Lab Report",
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            maxScore: 50,
            status: "NOT_STARTED",
          },
        ],
      },
      {
        lmsCourseId: "lms-301",
        name: "Microeconomics",
        code: "ECON 301",
        professorName: "Dr. Lisa Park",
        credits: 3,
        semester: "Spring 2026",
        currentGrade: 95.1,
        letterGrade: "A",
        assignments: [],
      },
    ];

    const syncedCourses = [];

    for (const mockCourse of mockSyncedCourses) {
      const existingCourse = await db.course.findFirst({
        where: {
          userId: session.user.id,
          lmsCourseId: mockCourse.lmsCourseId,
        },
      });

      let course;

      if (existingCourse) {
        course = await db.course.update({
          where: { id: existingCourse.id },
          data: {
            name: mockCourse.name,
            code: mockCourse.code,
            professorName: mockCourse.professorName,
            credits: mockCourse.credits,
            semester: mockCourse.semester,
            currentGrade: mockCourse.currentGrade,
            letterGrade: mockCourse.letterGrade,
          },
        });
      } else {
        course = await db.course.create({
          data: {
            userId: session.user.id,
            lmsCourseId: mockCourse.lmsCourseId,
            name: mockCourse.name,
            code: mockCourse.code,
            professorName: mockCourse.professorName,
            credits: mockCourse.credits,
            semester: mockCourse.semester,
            currentGrade: mockCourse.currentGrade,
            letterGrade: mockCourse.letterGrade,
          },
        });
      }

      for (const mockAssignment of mockCourse.assignments) {
        const existingAssignment = await db.assignment.findFirst({
          where: {
            courseId: course.id,
            lmsAssignmentId: mockAssignment.lmsAssignmentId,
          },
        });

        if (!existingAssignment) {
          await db.assignment.create({
            data: {
              courseId: course.id,
              userId: session.user.id,
              lmsAssignmentId: mockAssignment.lmsAssignmentId,
              title: mockAssignment.title,
              dueDate: new Date(mockAssignment.dueDate),
              maxScore: mockAssignment.maxScore,
              status: mockAssignment.status,
            },
          });
        }
      }

      syncedCourses.push(course);
    }

    if (lmsConnection) {
      await db.lmsConnection.update({
        where: { id: lmsConnection.id },
        data: { lastSyncAt: new Date() },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${syncedCourses.length} courses from ${user.university?.name || "your university"} LMS.`,
      courses: syncedCourses,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Course sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync courses from LMS." },
      { status: 500 }
    );
  }
}
