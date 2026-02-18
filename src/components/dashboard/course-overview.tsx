"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getGradeColor } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface Course {
  id: string;
  name: string;
  code: string;
  professor: string;
  grade: string | null;
  progress: number; // 0-100
}

interface CourseOverviewProps {
  courses?: Course[];
}

/* -------------------------------------------------------------------------- */
/*  Default data                                                               */
/* -------------------------------------------------------------------------- */

const DEFAULT_COURSES: Course[] = [
  {
    id: "1",
    name: "Artificial Intelligence",
    code: "CS 301",
    professor: "Dr. Chen",
    grade: "A",
    progress: 68,
  },
  {
    id: "2",
    name: "Linear Algebra",
    code: "MATH 240",
    professor: "Prof. Rivera",
    grade: "B+",
    progress: 72,
  },
  {
    id: "3",
    name: "American Literature",
    code: "ENG 205",
    professor: "Dr. Okafor",
    grade: "A-",
    progress: 65,
  },
  {
    id: "4",
    name: "Organic Chemistry",
    code: "CHEM 310",
    professor: "Prof. Walsh",
    grade: "C+",
    progress: 60,
  },
];

/* -------------------------------------------------------------------------- */
/*  Course row                                                                 */
/* -------------------------------------------------------------------------- */

function CourseRow({ course }: { course: Course }) {
  return (
    <Link
      href={`/courses/${course.id}`}
      className={cn(
        "group flex items-center gap-4 rounded-md px-3 py-3",
        "transition-all duration-150 ease-out",
        "hover:bg-phantom-accentBg"
      )}
    >
      {/* Course info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-body font-medium text-phantom-text">
          {course.name}
        </p>
        <p className="mt-0.5 text-caption text-phantom-textTertiary">
          {course.code} &middot; {course.professor}
        </p>
        <div className="mt-2 w-full">
          <Progress value={course.progress} />
        </div>
      </div>

      {/* Grade */}
      <div className="flex shrink-0 items-center gap-2">
        {course.grade && (
          <span
            className={cn(
              "font-mono text-[16px] font-bold leading-none",
              getGradeColor(course.grade)
            )}
          >
            {course.grade}
          </span>
        )}
        <ChevronRight className="h-3.5 w-3.5 text-phantom-textMuted opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
      </div>
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/*  Course overview card                                                       */
/* -------------------------------------------------------------------------- */

export function CourseOverview({
  courses = DEFAULT_COURSES,
}: CourseOverviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: 0.4 }}
    >
      <div
        className={cn(
          "rounded-lg border border-phantom-border bg-phantom-bgCard",
          "transition-all duration-200 ease-out",
          "hover:border-phantom-borderHover"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-0">
          <h2 className="text-card-title text-phantom-text">
            Course Overview
          </h2>
          <Link
            href="/courses"
            className="text-caption text-phantom-textMuted transition-colors hover:text-phantom-textSecondary"
          >
            View all
          </Link>
        </div>

        {/* Course list */}
        <div className="p-2 pt-3">
          {courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <p className="text-body text-phantom-textMuted">
                No courses enrolled
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {courses.map((course) => (
                <CourseRow key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
