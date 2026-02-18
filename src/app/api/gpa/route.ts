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

    const courses = await db.course.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        code: true,
        credits: true,
        currentGrade: true,
        letterGrade: true,
        semester: true,
      },
    });

    const gradedCourses = courses.filter(
      (c) => c.currentGrade !== null || c.letterGrade !== null
    );

    if (gradedCourses.length === 0) {
      return NextResponse.json({
        gpa: 0,
        totalCredits: 0,
        gradedCredits: 0,
        courses: courses.map((c) => ({
          id: c.id,
          name: c.name,
          code: c.code,
          credits: c.credits,
          currentGrade: c.currentGrade,
          letterGrade: c.letterGrade,
          gradePoints: null,
        })),
      });
    }

    let totalQualityPoints = 0;
    let totalGradedCredits = 0;

    const courseDetails = gradedCourses.map((course) => {
      const letter =
        course.letterGrade ||
        (course.currentGrade !== null
          ? getLetterGrade(course.currentGrade)
          : "F");

      const gradePoints = getGpaFromLetter(letter);

      totalQualityPoints += gradePoints * course.credits;
      totalGradedCredits += course.credits;

      return {
        id: course.id,
        name: course.name,
        code: course.code,
        credits: course.credits,
        currentGrade: course.currentGrade,
        letterGrade: letter,
        gradePoints,
      };
    });

    const gpa =
      totalGradedCredits > 0
        ? Math.round((totalQualityPoints / totalGradedCredits) * 100) / 100
        : 0;

    const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);

    return NextResponse.json({
      gpa,
      totalCredits,
      gradedCredits: totalGradedCredits,
      courses: courseDetails,
    });
  } catch (error) {
    console.error("GPA calculation error:", error);
    return NextResponse.json(
      { error: "Failed to calculate GPA." },
      { status: 500 }
    );
  }
}
