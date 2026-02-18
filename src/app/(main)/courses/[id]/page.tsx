"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Clock,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getGradeColor } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import {
  OverviewTab,
  LecturesTab,
  AssignmentsTab,
  StudyMaterialsTab,
  AnalyticsTab,
} from "@/components/courses/course-tabs";
import type { Course } from "@/types";

/* -------------------------------------------------------------------------- */
/*  Course Detail Page                                                         */
/* -------------------------------------------------------------------------- */

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ---- Fetch course ---- */
  const fetchCourse = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`/api/courses/${courseId}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Course not found");
        throw new Error("Failed to load course");
      }
      const data = await res.json();
      setCourse(data.course);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId) fetchCourse();
  }, [courseId, fetchCourse]);

  /* ---- Loading state ---- */
  if (isLoading) {
    return (
      <div className="px-6 py-8 max-w-[1200px] mx-auto">
        <Skeleton className="h-4 w-24 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
          <div className="grid grid-cols-4 gap-4 mt-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
          <Skeleton className="h-10 w-full mt-8" />
          <SkeletonText lines={6} className="mt-4" />
        </div>
      </div>
    );
  }

  /* ---- Error state ---- */
  if (error || !course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-6">
        <div
          className={cn(
            "w-14 h-14 rounded-lg mb-4",
            "bg-phantom-bgCard border border-phantom-border",
            "flex items-center justify-center"
          )}
        >
          <BookOpen size={24} className="text-phantom-textMuted" />
        </div>
        <h2 className="text-[17px] font-semibold text-phantom-text mb-1">
          {error || "Course not found"}
        </h2>
        <p className="text-body text-phantom-textMuted mb-5">
          This course may have been removed or the link is incorrect.
        </p>
        <Button variant="default" size="md" onClick={() => router.push("/courses")}>
          <ArrowLeft size={14} />
          Back to Courses
        </Button>
      </div>
    );
  }

  /* ---- Derived values ---- */
  const assignmentCount = course.assignments?.length ?? 0;
  const completedCount =
    course.assignments?.filter(
      (a) => a.status === "SUBMITTED" || a.status === "GRADED"
    ).length ?? 0;
  const nextDeadline = course.assignments
    ?.filter(
      (a) =>
        a.dueDate &&
        new Date(a.dueDate) > new Date() &&
        a.status !== "SUBMITTED" &&
        a.status !== "GRADED"
    )
    .sort(
      (a, b) =>
        new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
    )[0];

  return (
    <div className="px-6 py-8 max-w-[1200px] mx-auto">
      {/* ---- Back link ---- */}
      <Link
        href="/courses"
        className={cn(
          "inline-flex items-center gap-1.5 mb-6",
          "text-[12px] font-medium text-phantom-textMuted",
          "hover:text-phantom-text transition-colors"
        )}
      >
        <ArrowLeft size={14} />
        Courses
      </Link>

      {/* ================================================================= */}
      {/*  Top banner                                                        */}
      {/* ================================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "rounded-lg border border-phantom-border",
          "bg-phantom-bgCard p-6 mb-6"
        )}
      >
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-label-mono font-mono text-phantom-textMuted uppercase">
                {course.code}
              </span>
              {course.isActive && <Badge variant="success">Active</Badge>}
            </div>
            <h1 className="text-section-heading text-phantom-text">
              {course.name}
            </h1>
            <div className="flex items-center gap-3 text-body text-phantom-textSecondary">
              {course.professorName && (
                <span className="flex items-center gap-1">
                  <GraduationCap size={13} className="text-phantom-textMuted" />
                  {course.professorName}
                </span>
              )}
              {course.semester && (
                <span className="flex items-center gap-1">
                  <Clock size={13} className="text-phantom-textMuted" />
                  {course.semester}
                </span>
              )}
              <span className="text-phantom-textMuted">
                {course.credits} credits
              </span>
            </div>
          </div>

          {/* Grade display */}
          <div className="flex items-center gap-6">
            {course.letterGrade && (
              <div className="text-center">
                <p
                  className={cn(
                    "text-[24px] font-extrabold font-mono tracking-tight",
                    getGradeColor(course.letterGrade)
                  )}
                >
                  {course.letterGrade}
                </p>
                <p className="text-[10px] font-mono text-phantom-textMuted uppercase">
                  Grade
                </p>
              </div>
            )}
            {course.currentGrade !== null && course.currentGrade !== undefined && (
              <div className="text-center">
                <p className="text-[24px] font-extrabold font-mono text-phantom-text tracking-tight">
                  {course.currentGrade}%
                </p>
                <p className="text-[10px] font-mono text-phantom-textMuted uppercase">
                  Score
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-mono text-phantom-textMuted">
              Semester Progress
            </span>
            <span className="text-[11px] font-mono text-phantom-textSecondary">
              {course.semesterProgress}%
            </span>
          </div>
          <Progress value={course.semesterProgress} />
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-phantom-border/50">
          <div className="flex items-center gap-1.5">
            <BookOpen size={13} className="text-phantom-textMuted" />
            <span className="text-[12px] text-phantom-textSecondary">
              {assignmentCount} assignment{assignmentCount !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp size={13} className="text-phantom-textMuted" />
            <span className="text-[12px] text-phantom-textSecondary">
              {completedCount}/{assignmentCount} completed
            </span>
          </div>
          {nextDeadline && (
            <div className="flex items-center gap-1.5">
              <Clock size={13} className="text-phantom-warning" />
              <span className="text-[12px] text-phantom-warning">
                Next:{" "}
                {new Date(nextDeadline.dueDate!).toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* ================================================================= */}
      {/*  Tabs                                                              */}
      {/* ================================================================= */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="lectures">Lectures</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="materials">Study Materials</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab course={course} />
        </TabsContent>

        <TabsContent value="lectures">
          <LecturesTab course={course} />
        </TabsContent>

        <TabsContent value="assignments">
          <AssignmentsTab course={course} />
        </TabsContent>

        <TabsContent value="materials">
          <StudyMaterialsTab course={course} />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsTab course={course} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
