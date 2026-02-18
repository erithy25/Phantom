"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Clock, FileText } from "lucide-react";
import { cn, getGradeColor } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { Course } from "@/types";

/* -------------------------------------------------------------------------- */
/*  CourseCard                                                                 */
/* -------------------------------------------------------------------------- */

interface CourseCardProps {
  course: Course;
}

export const CourseCard = memo(function CourseCard({ course }: CourseCardProps) {
  /* ---- Derived data ---- */
  const assignmentCount = course.assignments?.length ?? 0;

  const nextDeadline = useMemo(() => {
    if (!course.assignments) return null;
    const upcoming = course.assignments
      .filter(
        (a) =>
          a.dueDate &&
          new Date(a.dueDate) > new Date() &&
          a.status !== "SUBMITTED" &&
          a.status !== "GRADED"
      )
      .sort(
        (a, b) =>
          new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
      );
    return upcoming[0] ?? null;
  }, [course.assignments]);

  const deadlineLabel = useMemo(() => {
    if (!nextDeadline?.dueDate) return null;
    const date = new Date(nextDeadline.dueDate);
    const now = new Date();
    const diffDays = Math.ceil(
      (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays <= 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    if (diffDays <= 7) return `Due in ${diffDays}d`;
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }, [nextDeadline]);

  return (
    <div
      className={cn(
        "group relative",
        "rounded-lg border border-phantom-border",
        "bg-phantom-bgCard",
        "p-5",
        "transition-all duration-200 ease-out",
        "hover:border-phantom-borderHover",
        "hover:-translate-y-0.5",
        "hover:shadow-phantom-md",
        "cursor-pointer"
      )}
    >
      {/* ---- Code & Grade row ---- */}
      <div className="flex items-start justify-between mb-2">
        <span className="text-label-mono font-mono text-phantom-textMuted uppercase">
          {course.code}
        </span>

        {course.letterGrade && (
          <span
            className={cn(
              "text-[24px] font-extrabold font-mono tracking-tight leading-none",
              getGradeColor(course.letterGrade)
            )}
          >
            {course.letterGrade}
          </span>
        )}
      </div>

      {/* ---- Course name ---- */}
      <h3 className="text-[15px] font-semibold text-phantom-text tracking-tight mb-1 line-clamp-2">
        {course.name}
      </h3>

      {/* ---- Professor ---- */}
      {course.professorName && (
        <p className="text-[12px] text-phantom-textSecondary mb-4">
          {course.professorName}
        </p>
      )}

      {/* ---- Progress bar ---- */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-mono text-phantom-textMuted">
            Progress
          </span>
          <span className="text-[10px] font-mono text-phantom-textSecondary">
            {course.semesterProgress}%
          </span>
        </div>
        <Progress value={course.semesterProgress} />
      </div>

      {/* ---- Badge pills ---- */}
      <div className="flex items-center gap-2 flex-wrap">
        {assignmentCount > 0 && (
          <Badge variant="default">
            <FileText size={10} className="mr-1" />
            {assignmentCount} assignment{assignmentCount !== 1 ? "s" : ""}
          </Badge>
        )}

        {deadlineLabel && (
          <Badge
            variant={
              nextDeadline?.dueDate &&
              new Date(nextDeadline.dueDate).getTime() - Date.now() <
                2 * 24 * 60 * 60 * 1000
                ? "warning"
                : "default"
            }
          >
            <Clock size={10} className="mr-1" />
            {deadlineLabel}
          </Badge>
        )}
      </div>

      {/* ---- Current score (small, bottom-right) ---- */}
      {course.currentGrade !== null && course.currentGrade !== undefined && (
        <div className="absolute bottom-5 right-5">
          <span className="text-[11px] font-mono text-phantom-textMuted">
            {course.currentGrade}%
          </span>
        </div>
      )}
    </div>
  );
});
