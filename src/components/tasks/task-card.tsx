"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Clock,
  Calendar,
  ArrowRight,
  FileCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import type { Assignment, AssignmentStatus, Priority } from "@/types";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getPriorityDot(priority: Priority): string {
  switch (priority) {
    case "HIGH":
      return "bg-phantom-danger";
    case "MEDIUM":
      return "bg-phantom-warning";
    case "LOW":
      return "bg-phantom-textMuted";
    default:
      return "bg-phantom-textMuted";
  }
}

function getStatusConfig(status: AssignmentStatus) {
  switch (status) {
    case "DRAFT_READY":
      return {
        label: "Draft Ready",
        bg: "bg-phantom-success/10 border-phantom-success/20",
        text: "text-phantom-success",
      };
    case "IN_PROGRESS":
      return {
        label: "In Progress",
        bg: "bg-phantom-warning/10 border-phantom-warning/20",
        text: "text-phantom-warning",
      };
    case "SUBMITTED":
      return {
        label: "Submitted",
        bg: "bg-phantom-bgTertiary/50 border-phantom-border",
        text: "text-phantom-textSecondary",
      };
    case "GRADED":
      return {
        label: "Graded",
        bg: "bg-phantom-bgTertiary/50 border-phantom-border",
        text: "text-phantom-textTertiary",
      };
    case "NOT_STARTED":
    default:
      return {
        label: "Not Started",
        bg: "bg-phantom-bgTertiary/50 border-phantom-border",
        text: "text-phantom-textMuted",
      };
  }
}

function formatDueDate(dateStr: string | null): {
  display: string;
  isOverdue: boolean;
  isDueToday: boolean;
  isDueSoon: boolean;
} {
  if (!dateStr) return { display: "No due date", isOverdue: false, isDueToday: false, isDueSoon: false };

  const due = new Date(dateStr);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  const isOverdue = diffMs < 0;
  const isDueToday = !isOverdue && diffHours < 24;
  const isDueSoon = !isOverdue && !isDueToday && diffDays < 3;

  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  };
  const display = due.toLocaleDateString("en-US", options);

  return { display, isOverdue, isDueToday, isDueSoon };
}

function formatEstimatedTime(minutes: number | null): string {
  if (!minutes) return "--";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

interface TaskCardProps {
  task: Assignment;
  index?: number;
}

export function TaskCard({ task, index = 0 }: TaskCardProps) {
  const statusConfig = getStatusConfig(task.status);
  const dueInfo = useMemo(() => formatDueDate(task.dueDate), [task.dueDate]);

  /* Progress for IN_PROGRESS tasks */
  const progressValue = useMemo(() => {
    if (task.status === "IN_PROGRESS") return 45; /* placeholder */
    if (task.status === "DRAFT_READY") return 80;
    if (task.status === "SUBMITTED") return 100;
    if (task.status === "GRADED") return 100;
    return 0;
  }, [task.status]);

  const isDraftReady = task.status === "DRAFT_READY";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
    >
      <Link href={`/tasks/${task.id}`} className="block group">
        <div
          className={cn(
            "rounded-lg border border-phantom-border",
            "bg-phantom-bgCard p-4",
            "transition-all duration-200 ease-out",
            "hover:border-phantom-borderHover hover:-translate-y-px",
            "hover:shadow-phantom-sm",
            "cursor-pointer"
          )}
        >
          {/* ---- Top Row ---- */}
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              {/* Priority Dot */}
              <div
                className={cn(
                  "w-2 h-2 rounded-full mt-1.5 shrink-0",
                  getPriorityDot(task.priority)
                )}
              />

              {/* Title + Course */}
              <div className="min-w-0 flex-1">
                <h3
                  className={cn(
                    "text-body font-medium text-phantom-text",
                    "group-hover:text-phantom-text",
                    "truncate"
                  )}
                >
                  {task.title}
                </h3>
                {task.course && (
                  <span
                    className={cn(
                      "inline-flex items-center mt-1",
                      "px-1.5 py-0.5 rounded-xs",
                      "bg-phantom-accentBg",
                      "text-micro text-phantom-textTertiary",
                      "font-medium"
                    )}
                  >
                    {task.course.code}
                  </span>
                )}
              </div>
            </div>

            {/* Status Badge */}
            <span
              className={cn(
                "inline-flex items-center shrink-0",
                "px-2 py-0.5 rounded-full border",
                "font-mono text-[10px] font-medium tracking-[0.05em] uppercase",
                statusConfig.bg,
                statusConfig.text
              )}
            >
              {statusConfig.label}
            </span>
          </div>

          {/* ---- Meta Row ---- */}
          <div className="flex items-center gap-4 mb-2">
            {/* Due Date */}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-phantom-textMuted" />
              <span
                className={cn(
                  "text-micro tabular-nums",
                  dueInfo.isOverdue
                    ? "text-phantom-danger font-medium"
                    : dueInfo.isDueToday
                    ? "text-phantom-warning font-medium"
                    : dueInfo.isDueSoon
                    ? "text-phantom-textSecondary"
                    : "text-phantom-textTertiary"
                )}
              >
                {dueInfo.isOverdue && "Overdue: "}
                {dueInfo.isDueToday && "Today: "}
                {dueInfo.display}
              </span>
            </div>

            {/* Estimated Time */}
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-phantom-textMuted" />
              <span className="font-mono text-micro text-phantom-textTertiary tabular-nums">
                {formatEstimatedTime(task.estimatedTime)}
              </span>
            </div>

            {/* GPA Impact */}
            {task.gpaImpact != null && task.gpaImpact > 0 && (
              <span className="font-mono text-micro text-phantom-success tabular-nums">
                +{task.gpaImpact.toFixed(2)} GPA
              </span>
            )}
          </div>

          {/* ---- Progress Bar (when applicable) ---- */}
          {(task.status === "IN_PROGRESS" || task.status === "DRAFT_READY") && (
            <div className="mb-2.5">
              <Progress value={progressValue} />
            </div>
          )}

          {/* ---- Draft Ready Action ---- */}
          {isDraftReady && (
            <div className="flex items-center justify-between pt-2 border-t border-phantom-border/50">
              <div className="flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-phantom-success" />
                <span className="text-caption text-phantom-success font-medium">
                  Draft Ready
                </span>
              </div>
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-sm",
                  "text-micro font-medium text-phantom-text",
                  "bg-phantom-success/10 border border-phantom-success/20",
                  "group-hover:bg-phantom-success/15",
                  "transition-colors duration-150"
                )}
              >
                Review Draft
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
