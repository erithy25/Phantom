import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { gpaSimulateSchema } from "@/lib/validations";
import { getGpaFromLetter, getLetterGrade } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = gpaSimulateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { courseGrades, name } = validation.data;

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
      },
    });

    let totalQualityPoints = 0;
    let totalCredits = 0;

    const simulatedCourses = courses.map((course) => {
      const simulatedLetter = courseGrades[course.id];

      let letter: string;
      if (simulatedLetter) {
        letter = simulatedLetter;
      } else if (course.letterGrade) {
        letter = course.letterGrade;
      } else if (course.currentGrade !== null) {
        letter = getLetterGrade(course.currentGrade);
      } else {
        return {
          id: course.id,
          name: course.name,
          code: course.code,
          credits: course.credits,
          originalGrade: course.letterGrade,
          simulatedGrade: null,
          gradePoints: null,
          changed: false,
        };
      }

      const gradePoints = getGpaFromLetter(letter);
      totalQualityPoints += gradePoints * course.credits;
      totalCredits += course.credits;

      return {
        id: course.id,
        name: course.name,
        code: course.code,
        credits: course.credits,
        originalGrade:
          course.letterGrade ||
          (course.currentGrade !== null
            ? getLetterGrade(course.currentGrade)
            : null),
        simulatedGrade: letter,
        gradePoints,
        changed: !!simulatedLetter,
      };
    });

    const simulatedGpa =
      totalCredits > 0
        ? Math.round((totalQualityPoints / totalCredits) * 100) / 100
        : 0;

    const currentGradedCourses = courses.filter(
      (c) => c.currentGrade !== null || c.letterGrade !== null
    );
    let currentGpa = 0;
    if (currentGradedCourses.length > 0) {
      let curQP = 0;
      let curCredits = 0;
      for (const c of currentGradedCourses) {
        const letter =
          c.letterGrade ||
          (c.currentGrade !== null ? getLetterGrade(c.currentGrade) : "F");
        curQP += getGpaFromLetter(letter) * c.credits;
        curCredits += c.credits;
      }
      currentGpa =
        curCredits > 0 ? Math.round((curQP / curCredits) * 100) / 100 : 0;
    }

    if (name) {
      await db.gpaScenario.create({
        data: {
          userId: session.user.id,
          name,
          courseGrades: courseGrades as Record<string, string>,
          resultGpa: simulatedGpa,
        },
      });
    }

    return NextResponse.json({
      currentGpa,
      simulatedGpa,
      gpaDelta: Math.round((simulatedGpa - currentGpa) * 100) / 100,
      totalCredits,
      courses: simulatedCourses,
    });
  } catch (error) {
    console.error("GPA simulation error:", error);
    return NextResponse.json(
      { error: "Failed to simulate GPA." },
      { status: 500 }
    );
  }
}
