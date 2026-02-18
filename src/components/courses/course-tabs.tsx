"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Play,
  Clock,
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
  Brain,
  Layers,
  TrendingUp,
  BarChart3,
  GraduationCap,
  BookOpen,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { cn, formatDate, formatDuration, getGradeColor } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Course, Assignment, Lecture, AssignmentStatus } from "@/types";

/* -------------------------------------------------------------------------- */
/*  Shared animation wrapper                                                   */
/* -------------------------------------------------------------------------- */

function FadeInSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Status helpers                                                             */
/* -------------------------------------------------------------------------- */

function getStatusIcon(status: AssignmentStatus) {
  switch (status) {
    case "GRADED":
      return <CheckCircle2 size={14} className="text-phantom-success" />;
    case "SUBMITTED":
      return <CheckCircle2 size={14} className="text-phantom-textSecondary" />;
    case "DRAFT_READY":
      return <FileText size={14} className="text-phantom-warning" />;
    case "IN_PROGRESS":
      return <Loader2 size={14} className="text-phantom-textSecondary animate-spin" />;
    case "NOT_STARTED":
    default:
      return <Circle size={14} className="text-phantom-textMuted" />;
  }
}

function getStatusLabel(status: AssignmentStatus): string {
  const map: Record<AssignmentStatus, string> = {
    NOT_STARTED: "Not Started",
    IN_PROGRESS: "In Progress",
    DRAFT_READY: "Draft Ready",
    SUBMITTED: "Submitted",
    GRADED: "Graded",
  };
  return map[status] || status;
}

function getStatusVariant(
  status: AssignmentStatus
): "default" | "success" | "warning" | "danger" {
  switch (status) {
    case "GRADED":
      return "success";
    case "SUBMITTED":
      return "default";
    case "DRAFT_READY":
      return "warning";
    case "IN_PROGRESS":
      return "default";
    case "NOT_STARTED":
    default:
      return "default";
  }
}

/* ========================================================================== */
/*  1. OVERVIEW TAB                                                            */
/* ========================================================================== */

export function OverviewTab({ course }: { course: Course }) {
  const upcomingAssignments = useMemo(() => {
    if (!course.assignments) return [];
    return course.assignments
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
      )
      .slice(0, 5);
  }, [course.assignments]);

  const gradedCount = course.assignments?.filter((a) => a.status === "GRADED").length ?? 0;
  const totalAssignments = course.assignments?.length ?? 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* ---- Main content ---- */}
      <div className="lg:col-span-2 space-y-5">
        {/* Course summary card */}
        <FadeInSection>
          <div
            className={cn(
              "rounded-lg border border-phantom-border",
              "bg-phantom-bgCard p-5"
            )}
          >
            <h3 className="text-card-title text-phantom-text mb-3 flex items-center gap-2">
              <BookOpen size={15} className="text-phantom-textMuted" />
              Course Overview
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] font-mono text-phantom-textMuted uppercase mb-1">
                  Credits
                </p>
                <p className="text-[18px] font-bold font-mono text-phantom-text">
                  {course.credits}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-phantom-textMuted uppercase mb-1">
                  Semester
                </p>
                <p className="text-[13px] font-medium text-phantom-text">
                  {course.semester || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-phantom-textMuted uppercase mb-1">
                  Assignments
                </p>
                <p className="text-[18px] font-bold font-mono text-phantom-text">
                  {totalAssignments}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-phantom-textMuted uppercase mb-1">
                  Graded
                </p>
                <p className="text-[18px] font-bold font-mono text-phantom-text">
                  {gradedCount}
                </p>
              </div>
            </div>
          </div>
        </FadeInSection>

        {/* Upcoming assignments */}
        <FadeInSection delay={0.1}>
          <div
            className={cn(
              "rounded-lg border border-phantom-border",
              "bg-phantom-bgCard p-5"
            )}
          >
            <h3 className="text-card-title text-phantom-text mb-3 flex items-center gap-2">
              <Calendar size={15} className="text-phantom-textMuted" />
              Upcoming Assignments
            </h3>
            {upcomingAssignments.length === 0 ? (
              <p className="text-body text-phantom-textMuted py-4 text-center">
                No upcoming assignments
              </p>
            ) : (
              <div className="space-y-2">
                {upcomingAssignments.map((a) => (
                  <div
                    key={a.id}
                    className={cn(
                      "flex items-center justify-between",
                      "px-3 py-2.5 rounded-md",
                      "bg-phantom-bgSecondary",
                      "hover:bg-phantom-bgTertiary transition-colors"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      {getStatusIcon(a.status)}
                      <span className="text-[13px] text-phantom-text">
                        {a.title}
                      </span>
                    </div>
                    {a.dueDate && (
                      <span className="text-[11px] font-mono text-phantom-textMuted flex-shrink-0">
                        {formatDate(a.dueDate)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </FadeInSection>
      </div>

      {/* ---- Sidebar ---- */}
      <div className="space-y-5">
        {/* Professor profile */}
        <FadeInSection delay={0.15}>
          <div
            className={cn(
              "rounded-lg border border-phantom-border",
              "bg-phantom-bgCard p-5"
            )}
          >
            <h3 className="text-card-title text-phantom-text mb-3 flex items-center gap-2">
              <GraduationCap size={15} className="text-phantom-textMuted" />
              Professor
            </h3>
            {course.professorName ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full",
                      "bg-phantom-accentBg",
                      "flex items-center justify-center"
                    )}
                  >
                    <span className="text-[14px] font-semibold text-phantom-textSecondary">
                      {course.professorName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-phantom-text">
                      {course.professorName}
                    </p>
                    <p className="text-[11px] text-phantom-textMuted">
                      {course.code}
                    </p>
                  </div>
                </div>
                <p className="text-[12px] text-phantom-textSecondary leading-relaxed">
                  Professor profile and grading tendencies will appear here once
                  Phantom gathers enough data from your coursework.
                </p>
              </div>
            ) : (
              <p className="text-body text-phantom-textMuted py-2">
                No professor assigned
              </p>
            )}
          </div>
        </FadeInSection>

        {/* Grade breakdown placeholder */}
        <FadeInSection delay={0.2}>
          <div
            className={cn(
              "rounded-lg border border-phantom-border",
              "bg-phantom-bgCard p-5"
            )}
          >
            <h3 className="text-card-title text-phantom-text mb-3 flex items-center gap-2">
              <BarChart3 size={15} className="text-phantom-textMuted" />
              Grade Breakdown
            </h3>
            {course.currentGrade !== null && course.currentGrade !== undefined ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[28px] font-bold font-mono text-phantom-text tracking-tight">
                    {course.currentGrade}%
                  </span>
                  {course.letterGrade && (
                    <span
                      className={cn(
                        "text-[20px] font-bold font-mono",
                        getGradeColor(course.letterGrade)
                      )}
                    >
                      {course.letterGrade}
                    </span>
                  )}
                </div>
                <Progress value={course.currentGrade} />
                <p className="text-[11px] text-phantom-textMuted">
                  Based on {gradedCount} graded assignment{gradedCount !== 1 ? "s" : ""}
                </p>
              </div>
            ) : (
              <p className="text-body text-phantom-textMuted py-2">
                No grades recorded yet
              </p>
            )}
          </div>
        </FadeInSection>
      </div>
    </div>
  );
}

/* ========================================================================== */
/*  2. LECTURES TAB                                                            */
/* ========================================================================== */

export function LecturesTab({ course }: { course: Course }) {
  const lectures = course.lectures ?? [];

  if (lectures.length === 0) {
    return (
      <FadeInSection>
        <div className="flex flex-col items-center justify-center py-16">
          <div
            className={cn(
              "w-12 h-12 rounded-lg mb-3",
              "bg-phantom-bgCard border border-phantom-border",
              "flex items-center justify-center"
            )}
          >
            <Play size={20} className="text-phantom-textMuted" />
          </div>
          <h3 className="text-[15px] font-semibold text-phantom-text mb-1">
            No lectures yet
          </h3>
          <p className="text-body text-phantom-textMuted text-center max-w-sm">
            Lecture recordings and transcripts will appear here once captured by
            Phantom.
          </p>
        </div>
      </FadeInSection>
    );
  }

  return (
    <FadeInSection>
      <div className="space-y-2">
        {lectures.map((lecture, i) => (
          <motion.div
            key={lecture.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={cn(
              "flex items-center gap-4",
              "px-4 py-3.5 rounded-lg",
              "border border-phantom-border",
              "bg-phantom-bgCard",
              "hover:border-phantom-borderHover hover:bg-phantom-bgCardHover",
              "transition-all duration-200",
              "cursor-pointer group"
            )}
          >
            {/* Play icon */}
            <div
              className={cn(
                "flex items-center justify-center flex-shrink-0",
                "w-10 h-10 rounded-md",
                "bg-phantom-accentBg",
                "group-hover:bg-phantom-bgTertiary",
                "transition-colors"
              )}
            >
              <Play size={16} className="text-phantom-textSecondary" />
            </div>

            {/* Lecture info */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-phantom-text truncate">
                {lecture.title || `Lecture ${i + 1}`}
              </p>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[11px] font-mono text-phantom-textMuted">
                  {formatDate(lecture.date)}
                </span>
                {lecture.durationSeconds && (
                  <span className="text-[11px] font-mono text-phantom-textMuted">
                    {formatDuration(lecture.durationSeconds)}
                  </span>
                )}
                {lecture.topics && lecture.topics.length > 0 && (
                  <span className="text-[11px] text-phantom-textMuted truncate">
                    {lecture.topics.slice(0, 2).join(", ")}
                  </span>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {lecture.summary && (
                <Badge variant="success">Summarized</Badge>
              )}
              {lecture.processingStatus === "PROCESSING" && (
                <Badge variant="warning">
                  <Loader2 size={10} className="mr-1 animate-spin" />
                  Processing
                </Badge>
              )}
              {lecture.flashcards && lecture.flashcards.length > 0 && (
                <Badge variant="default">
                  <Layers size={10} className="mr-1" />
                  {lecture.flashcards.length} cards
                </Badge>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </FadeInSection>
  );
}

/* ========================================================================== */
/*  3. ASSIGNMENTS TAB                                                         */
/* ========================================================================== */

export function AssignmentsTab({ course }: { course: Course }) {
  const assignments = course.assignments ?? [];

  if (assignments.length === 0) {
    return (
      <FadeInSection>
        <div className="flex flex-col items-center justify-center py-16">
          <div
            className={cn(
              "w-12 h-12 rounded-lg mb-3",
              "bg-phantom-bgCard border border-phantom-border",
              "flex items-center justify-center"
            )}
          >
            <FileText size={20} className="text-phantom-textMuted" />
          </div>
          <h3 className="text-[15px] font-semibold text-phantom-text mb-1">
            No assignments yet
          </h3>
          <p className="text-body text-phantom-textMuted text-center max-w-sm">
            Assignments will appear here as they are added from your syllabus or
            LMS.
          </p>
        </div>
      </FadeInSection>
    );
  }

  return (
    <FadeInSection>
      <div className="space-y-2">
        {assignments.map((assignment, i) => (
          <motion.div
            key={assignment.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={cn(
              "flex items-center gap-4",
              "px-4 py-3.5 rounded-lg",
              "border border-phantom-border",
              "bg-phantom-bgCard",
              "hover:border-phantom-borderHover hover:bg-phantom-bgCardHover",
              "transition-all duration-200",
              "cursor-pointer"
            )}
          >
            {/* Status icon */}
            <div className="flex-shrink-0">{getStatusIcon(assignment.status)}</div>

            {/* Assignment info */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-phantom-text truncate">
                {assignment.title}
              </p>
              <div className="flex items-center gap-3 mt-0.5">
                {assignment.dueDate && (
                  <span className="text-[11px] font-mono text-phantom-textMuted">
                    Due {formatDate(assignment.dueDate)}
                  </span>
                )}
                {assignment.weight !== null && assignment.weight !== undefined && (
                  <span className="text-[11px] font-mono text-phantom-textMuted">
                    {assignment.weight}% weight
                  </span>
                )}
              </div>
            </div>

            {/* Status badge & grade */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <Badge variant={getStatusVariant(assignment.status)}>
                {getStatusLabel(assignment.status)}
              </Badge>

              {assignment.grade !== null && assignment.grade !== undefined && (
                <span
                  className={cn(
                    "text-[14px] font-bold font-mono tracking-tight",
                    assignment.grade >= 90
                      ? "text-phantom-success"
                      : assignment.grade >= 80
                        ? "text-phantom-warning"
                        : "text-phantom-text"
                  )}
                >
                  {assignment.grade}%
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </FadeInSection>
  );
}

/* ========================================================================== */
/*  4. STUDY MATERIALS TAB                                                     */
/* ========================================================================== */

export function StudyMaterialsTab({ course }: { course: Course }) {
  const flashcardCount =
    course.lectures?.reduce(
      (sum, l) => sum + (l.flashcards?.length ?? 0),
      0
    ) ?? 0;

  const examQuestionCount =
    course.lectures?.reduce(
      (sum, l) => sum + (l.examQuestions?.length ?? 0),
      0
    ) ?? 0;

  return (
    <FadeInSection>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Flashcards card */}
        <div
          className={cn(
            "rounded-lg border border-phantom-border",
            "bg-phantom-bgCard p-5",
            "hover:border-phantom-borderHover hover:-translate-y-px",
            "transition-all duration-200 cursor-pointer"
          )}
        >
          <div className="flex items-center gap-2.5 mb-3">
            <div
              className={cn(
                "flex items-center justify-center",
                "w-9 h-9 rounded-md",
                "bg-phantom-accentBg"
              )}
            >
              <Brain size={18} className="text-phantom-textSecondary" />
            </div>
            <div>
              <h4 className="text-card-title text-phantom-text">Flashcards</h4>
              <p className="text-[11px] text-phantom-textMuted">
                Spaced repetition review
              </p>
            </div>
          </div>
          <p className="text-[28px] font-bold font-mono text-phantom-text tracking-tight mb-1">
            {flashcardCount}
          </p>
          <p className="text-[11px] text-phantom-textMuted">
            cards generated from lectures
          </p>
        </div>

        {/* Practice questions card */}
        <div
          className={cn(
            "rounded-lg border border-phantom-border",
            "bg-phantom-bgCard p-5",
            "hover:border-phantom-borderHover hover:-translate-y-px",
            "transition-all duration-200 cursor-pointer"
          )}
        >
          <div className="flex items-center gap-2.5 mb-3">
            <div
              className={cn(
                "flex items-center justify-center",
                "w-9 h-9 rounded-md",
                "bg-phantom-accentBg"
              )}
            >
              <AlertCircle size={18} className="text-phantom-textSecondary" />
            </div>
            <div>
              <h4 className="text-card-title text-phantom-text">
                Practice Questions
              </h4>
              <p className="text-[11px] text-phantom-textMuted">
                AI-generated exam prep
              </p>
            </div>
          </div>
          <p className="text-[28px] font-bold font-mono text-phantom-text tracking-tight mb-1">
            {examQuestionCount}
          </p>
          <p className="text-[11px] text-phantom-textMuted">
            questions across all topics
          </p>
        </div>

        {/* Study notes card */}
        <div
          className={cn(
            "rounded-lg border border-phantom-border",
            "bg-phantom-bgCard p-5",
            "hover:border-phantom-borderHover hover:-translate-y-px",
            "transition-all duration-200 cursor-pointer"
          )}
        >
          <div className="flex items-center gap-2.5 mb-3">
            <div
              className={cn(
                "flex items-center justify-center",
                "w-9 h-9 rounded-md",
                "bg-phantom-accentBg"
              )}
            >
              <FileText size={18} className="text-phantom-textSecondary" />
            </div>
            <div>
              <h4 className="text-card-title text-phantom-text">
                Lecture Summaries
              </h4>
              <p className="text-[11px] text-phantom-textMuted">
                AI-generated notes
              </p>
            </div>
          </div>
          <p className="text-[28px] font-bold font-mono text-phantom-text tracking-tight mb-1">
            {course.lectures?.filter((l) => l.summary).length ?? 0}
          </p>
          <p className="text-[11px] text-phantom-textMuted">
            lectures summarized
          </p>
        </div>
      </div>

      {/* Empty state if no materials */}
      {flashcardCount === 0 && examQuestionCount === 0 && (
        <div className="flex flex-col items-center justify-center py-12 mt-4">
          <p className="text-body text-phantom-textMuted text-center max-w-sm">
            Study materials will be generated automatically from your lecture
            recordings and course content. Start by recording a lecture.
          </p>
        </div>
      )}
    </FadeInSection>
  );
}

/* ========================================================================== */
/*  5. ANALYTICS TAB                                                           */
/* ========================================================================== */

export function AnalyticsTab({ course }: { course: Course }) {
  const assignments = course.assignments ?? [];
  const gradedAssignments = assignments.filter(
    (a) => a.grade !== null && a.grade !== undefined
  );

  const avgGrade =
    gradedAssignments.length > 0
      ? gradedAssignments.reduce((sum, a) => sum + (a.grade ?? 0), 0) /
        gradedAssignments.length
      : null;

  const highestGrade =
    gradedAssignments.length > 0
      ? Math.max(...gradedAssignments.map((a) => a.grade ?? 0))
      : null;

  const lowestGrade =
    gradedAssignments.length > 0
      ? Math.min(...gradedAssignments.map((a) => a.grade ?? 0))
      : null;

  return (
    <FadeInSection>
      <div className="space-y-5">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            className={cn(
              "rounded-lg border border-phantom-border",
              "bg-phantom-bgCard p-4 text-center"
            )}
          >
            <p className="text-[10px] font-mono text-phantom-textMuted uppercase mb-1">
              Current Grade
            </p>
            <p
              className={cn(
                "text-large-metric font-mono",
                course.letterGrade
                  ? getGradeColor(course.letterGrade)
                  : "text-phantom-text"
              )}
            >
              {course.currentGrade !== null && course.currentGrade !== undefined
                ? `${course.currentGrade}%`
                : "--"}
            </p>
          </div>
          <div
            className={cn(
              "rounded-lg border border-phantom-border",
              "bg-phantom-bgCard p-4 text-center"
            )}
          >
            <p className="text-[10px] font-mono text-phantom-textMuted uppercase mb-1">
              Average
            </p>
            <p className="text-large-metric font-mono text-phantom-text">
              {avgGrade !== null ? `${avgGrade.toFixed(1)}%` : "--"}
            </p>
          </div>
          <div
            className={cn(
              "rounded-lg border border-phantom-border",
              "bg-phantom-bgCard p-4 text-center"
            )}
          >
            <p className="text-[10px] font-mono text-phantom-textMuted uppercase mb-1">
              Highest
            </p>
            <p className="text-large-metric font-mono text-phantom-success">
              {highestGrade !== null ? `${highestGrade}%` : "--"}
            </p>
          </div>
          <div
            className={cn(
              "rounded-lg border border-phantom-border",
              "bg-phantom-bgCard p-4 text-center"
            )}
          >
            <p className="text-[10px] font-mono text-phantom-textMuted uppercase mb-1">
              Lowest
            </p>
            <p className="text-large-metric font-mono text-phantom-danger">
              {lowestGrade !== null ? `${lowestGrade}%` : "--"}
            </p>
          </div>
        </div>

        {/* Grade chart placeholder */}
        <div
          className={cn(
            "rounded-lg border border-phantom-border",
            "bg-phantom-bgCard p-5"
          )}
        >
          <h3 className="text-card-title text-phantom-text mb-4 flex items-center gap-2">
            <TrendingUp size={15} className="text-phantom-textMuted" />
            Grade Trend
          </h3>

          {gradedAssignments.length >= 2 ? (
            /* ---- Simple visual bar chart ---- */
            <div className="space-y-2">
              {gradedAssignments.map((a, i) => (
                <div key={a.id} className="flex items-center gap-3">
                  <span className="text-[11px] text-phantom-textMuted w-28 truncate flex-shrink-0">
                    {a.title}
                  </span>
                  <div className="flex-1 h-5 bg-phantom-bgSecondary rounded overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${a.grade ?? 0}%` }}
                      transition={{ duration: 0.6, delay: i * 0.1 }}
                      className={cn(
                        "h-full rounded",
                        (a.grade ?? 0) >= 90
                          ? "bg-phantom-success/70"
                          : (a.grade ?? 0) >= 80
                            ? "bg-phantom-warning/70"
                            : "bg-phantom-text/30"
                      )}
                    />
                  </div>
                  <span className="text-[12px] font-mono font-semibold text-phantom-text w-10 text-right flex-shrink-0">
                    {a.grade}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <BarChart3
                size={32}
                className="text-phantom-textMuted mb-3"
              />
              <p className="text-body text-phantom-textMuted text-center max-w-sm">
                Grade trend chart will appear after at least 2 assignments have
                been graded.
              </p>
            </div>
          )}
        </div>

        {/* Completion progress */}
        <div
          className={cn(
            "rounded-lg border border-phantom-border",
            "bg-phantom-bgCard p-5"
          )}
        >
          <h3 className="text-card-title text-phantom-text mb-4 flex items-center gap-2">
            <CheckCircle2 size={15} className="text-phantom-textMuted" />
            Completion Progress
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(
              [
                { label: "Not Started", status: "NOT_STARTED" as const },
                { label: "In Progress", status: "IN_PROGRESS" as const },
                { label: "Submitted", status: "SUBMITTED" as const },
                { label: "Graded", status: "GRADED" as const },
              ] as const
            ).map(({ label, status }) => {
              const count = assignments.filter(
                (a) => a.status === status
              ).length;
              return (
                <div
                  key={status}
                  className={cn(
                    "rounded-md bg-phantom-bgSecondary",
                    "p-3 text-center"
                  )}
                >
                  <p className="text-[18px] font-bold font-mono text-phantom-text">
                    {count}
                  </p>
                  <p className="text-[10px] font-mono text-phantom-textMuted uppercase">
                    {label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </FadeInSection>
  );
}
