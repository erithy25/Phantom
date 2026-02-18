"use client";

import { motion } from "framer-motion";
import { Clock, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getPriorityColor, formatRelativeTime } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface Task {
  id: string;
  title: string;
  courseCode: string;
  dueDate: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  hasDraft?: boolean;
  estimatedMinutes?: number;
}

interface UpcomingTasksProps {
  tasks?: Task[];
}

/* -------------------------------------------------------------------------- */
/*  Default data                                                               */
/* -------------------------------------------------------------------------- */

const DEFAULT_TASKS: Task[] = [
  {
    id: "1",
    title: "Research Paper: AI in Healthcare",
    courseCode: "CS 301",
    dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    priority: "HIGH",
    hasDraft: true,
    estimatedMinutes: 45,
  },
  {
    id: "2",
    title: "Problem Set 7: Linear Algebra",
    courseCode: "MATH 240",
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString(),
    priority: "HIGH",
    estimatedMinutes: 90,
  },
  {
    id: "3",
    title: "Reading Response: Chapter 12",
    courseCode: "ENG 205",
    dueDate: new Date(Date.now() + 4 * 86400000).toISOString(),
    priority: "MEDIUM",
    hasDraft: true,
    estimatedMinutes: 20,
  },
  {
    id: "4",
    title: "Lab Report: Organic Synthesis",
    courseCode: "CHEM 310",
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    priority: "MEDIUM",
    estimatedMinutes: 60,
  },
  {
    id: "5",
    title: "Group Presentation Slides",
    courseCode: "BUS 200",
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    priority: "LOW",
    estimatedMinutes: 30,
  },
];

/* -------------------------------------------------------------------------- */
/*  Task row                                                                   */
/* -------------------------------------------------------------------------- */

function TaskRow({ task }: { task: Task }) {
  const dueDate = new Date(task.dueDate);
  const now = new Date();
  const diffDays = Math.ceil(
    (dueDate.getTime() - now.getTime()) / 86400000
  );

  const dueLabel =
    diffDays <= 0
      ? "Overdue"
      : diffDays === 1
        ? "Due tomorrow"
        : `Due in ${diffDays} days`;

  const dueColor =
    diffDays <= 1
      ? "text-phantom-danger"
      : diffDays <= 3
        ? "text-phantom-warning"
        : "text-phantom-textMuted";

  return (
    <Link
      href={`/tasks/${task.id}`}
      className={cn(
        "group flex items-center gap-3 rounded-md px-3 py-3",
        "transition-all duration-150 ease-out",
        "hover:bg-phantom-accentBg"
      )}
    >
      {/* Priority dot */}
      <span
        className={cn(
          "h-2 w-2 shrink-0 rounded-full",
          getPriorityColor(task.priority)
        )}
      />

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-body font-medium text-phantom-text">
          {task.title}
        </p>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="text-caption text-phantom-textTertiary">
            {task.courseCode}
          </span>
          <span className="text-phantom-textMuted">&middot;</span>
          <span className={cn("text-caption", dueColor)}>{dueLabel}</span>
        </div>
      </div>

      {/* Badges */}
      <div className="flex shrink-0 items-center gap-2">
        {task.hasDraft && (
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5",
              "bg-phantom-success/10 font-mono text-[11px] font-medium text-phantom-success",
              "border border-phantom-success/20"
            )}
          >
            Draft Ready
          </span>
        )}
        {task.estimatedMinutes && (
          <span className="flex items-center gap-1 text-caption text-phantom-textMuted">
            <Clock className="h-3 w-3" />
            {task.estimatedMinutes}m
          </span>
        )}
        <ChevronRight className="h-3.5 w-3.5 text-phantom-textMuted opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
      </div>
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/*  Upcoming tasks card                                                        */
/* -------------------------------------------------------------------------- */

export function UpcomingTasks({ tasks = DEFAULT_TASKS }: UpcomingTasksProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: 0.35 }}
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
          <div className="flex items-center gap-2">
            <h2 className="text-card-title text-phantom-text">
              Upcoming Tasks
            </h2>
            <span
              className={cn(
                "inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5",
                "bg-phantom-accentBg font-mono text-[11px] font-medium text-phantom-textTertiary"
              )}
            >
              {tasks.length}
            </span>
          </div>
          <Link
            href="/tasks"
            className="text-caption text-phantom-textMuted transition-colors hover:text-phantom-textSecondary"
          >
            View all
          </Link>
        </div>

        {/* Task list */}
        <div className="max-h-[340px] overflow-y-auto p-2 pt-3">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <p className="text-body text-phantom-textMuted">
                No upcoming tasks
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {tasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
