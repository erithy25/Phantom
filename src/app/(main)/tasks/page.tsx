"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { CheckSquare, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskCard } from "@/components/tasks/task-card";
import {
  TaskFilters,
  type TaskFilter,
  type TaskSort,
} from "@/components/tasks/task-filters";
import type { Assignment } from "@/types";

/* -------------------------------------------------------------------------- */
/*  Mock Data (fallback when API unavailable)                                  */
/* -------------------------------------------------------------------------- */

const MOCK_TASKS: Assignment[] = [
  {
    id: "t1",
    courseId: "1",
    title: "Reaction Mechanisms Problem Set #7",
    description: "Complete problems 1-15 on SN1/SN2 reactions",
    dueDate: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    weight: 5,
    maxScore: 100,
    grade: null,
    status: "DRAFT_READY",
    priority: "HIGH",
    estimatedTime: 120,
    gpaImpact: 0.08,
    course: { name: "Organic Chemistry", code: "CHEM 201" },
  },
  {
    id: "t2",
    courseId: "2",
    title: "Binary Search Tree Implementation",
    description: "Implement BST with insert, delete, and traversal operations",
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    weight: 10,
    maxScore: 100,
    grade: null,
    status: "IN_PROGRESS",
    priority: "HIGH",
    estimatedTime: 180,
    gpaImpact: 0.12,
    course: { name: "Data Structures", code: "CS 201" },
  },
  {
    id: "t3",
    courseId: "3",
    title: "Surface Integrals Homework",
    description: "Calculate surface integrals for given vector fields",
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    weight: 4,
    maxScore: 100,
    grade: null,
    status: "NOT_STARTED",
    priority: "MEDIUM",
    estimatedTime: 90,
    gpaImpact: 0.05,
    course: { name: "Calculus III", code: "MATH 301" },
  },
  {
    id: "t4",
    courseId: "4",
    title: "Kant's Critique: Analytical Essay",
    description:
      "Write a 2000-word analytical essay on Kant's Critique of Pure Reason",
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    weight: 15,
    maxScore: 100,
    grade: null,
    status: "DRAFT_READY",
    priority: "MEDIUM",
    estimatedTime: 300,
    gpaImpact: 0.1,
    course: { name: "Modern Philosophy", code: "PHIL 220" },
  },
  {
    id: "t5",
    courseId: "5",
    title: "Technical Report: API Documentation",
    description: "Write professional API documentation for the class project",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    weight: 8,
    maxScore: 100,
    grade: null,
    status: "NOT_STARTED",
    priority: "LOW",
    estimatedTime: 150,
    gpaImpact: 0.04,
    course: { name: "Technical Writing", code: "ENG 215" },
  },
  {
    id: "t6",
    courseId: "2",
    title: "Graph Algorithms Quiz",
    description: "Online quiz on Dijkstra, BFS, DFS",
    dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    weight: 3,
    maxScore: 50,
    grade: 42,
    status: "GRADED",
    priority: "MEDIUM",
    estimatedTime: 45,
    gpaImpact: 0,
    course: { name: "Data Structures", code: "CS 201" },
  },
  {
    id: "t7",
    courseId: "1",
    title: "Lab Report: Esterification",
    description: "Write lab report for last week's esterification experiment",
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    weight: 6,
    maxScore: 100,
    grade: null,
    status: "NOT_STARTED",
    priority: "HIGH",
    estimatedTime: 120,
    gpaImpact: 0.06,
    course: { name: "Organic Chemistry", code: "CHEM 201" },
  },
];

/* -------------------------------------------------------------------------- */
/*  Filter / Sort Logic                                                        */
/* -------------------------------------------------------------------------- */

function isOverdue(task: Assignment): boolean {
  if (!task.dueDate) return false;
  if (task.status === "SUBMITTED" || task.status === "GRADED") return false;
  return new Date(task.dueDate).getTime() < Date.now();
}

function isDueToday(task: Assignment): boolean {
  if (!task.dueDate) return false;
  const due = new Date(task.dueDate);
  const now = new Date();
  return (
    due.getDate() === now.getDate() &&
    due.getMonth() === now.getMonth() &&
    due.getFullYear() === now.getFullYear() &&
    !isOverdue(task)
  );
}

function isDueThisWeek(task: Assignment): boolean {
  if (!task.dueDate) return false;
  const due = new Date(task.dueDate);
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return due >= now && due <= weekFromNow;
}

function filterTasks(tasks: Assignment[], filter: TaskFilter): Assignment[] {
  switch (filter) {
    case "due_today":
      return tasks.filter(isDueToday);
    case "due_week":
      return tasks.filter(isDueThisWeek);
    case "draft_ready":
      return tasks.filter((t) => t.status === "DRAFT_READY");
    case "overdue":
      return tasks.filter(isOverdue);
    case "all":
    default:
      return tasks;
  }
}

function sortTasks(tasks: Assignment[], sort: TaskSort): Assignment[] {
  const sorted = [...tasks];
  switch (sort) {
    case "due_date":
      return sorted.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    case "priority": {
      const prio = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return sorted.sort(
        (a, b) => (prio[a.priority] ?? 2) - (prio[b.priority] ?? 2)
      );
    }
    case "course":
      return sorted.sort((a, b) =>
        (a.course?.code ?? "").localeCompare(b.course?.code ?? "")
      );
    case "gpa_impact":
      return sorted.sort(
        (a, b) => (b.gpaImpact ?? 0) - (a.gpaImpact ?? 0)
      );
    default:
      return sorted;
  }
}

/* -------------------------------------------------------------------------- */
/*  Page Skeleton                                                              */
/* -------------------------------------------------------------------------- */

function TasksSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="rounded-lg border border-phantom-border p-4 space-y-3"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="w-2 h-2 rounded-full" />
            <Skeleton className="h-3 w-48" />
            <div className="flex-1" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="flex items-center gap-4 ml-5">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="h-2.5 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page Component                                                             */
/* -------------------------------------------------------------------------- */

export default function TasksPage() {
  const [tasks, setTasks] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<TaskFilter>("all");
  const [activeSort, setActiveSort] = useState<TaskSort>("due_date");

  useEffect(() => {
    async function fetchTasks() {
      setLoading(true);
      try {
        const res = await fetch("/api/tasks");
        if (res.ok) {
          const data = await res.json();
          setTasks(data.tasks ?? data);
        } else {
          setTasks(MOCK_TASKS);
        }
      } catch {
        setTasks(MOCK_TASKS);
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, []);

  /* Compute filter counts */
  const counts = useMemo(() => {
    return {
      all: tasks.length,
      due_today: tasks.filter(isDueToday).length,
      due_week: tasks.filter(isDueThisWeek).length,
      draft_ready: tasks.filter((t) => t.status === "DRAFT_READY").length,
      overdue: tasks.filter(isOverdue).length,
    };
  }, [tasks]);

  /* Filter + Sort */
  const displayTasks = useMemo(() => {
    const filtered = filterTasks(tasks, activeFilter);
    return sortTasks(filtered, activeSort);
  }, [tasks, activeFilter, activeSort]);

  return (
    <div className="max-w-[900px] mx-auto px-6 py-8 space-y-6">
      {/* ---- Page Header ---- */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-page-title text-phantom-text">
            Task Command Center
          </h1>
          <p className="text-body text-phantom-textSecondary mt-1">
            Track assignments, review drafts, and manage deadlines.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-phantom-textMuted" />
          <span className="font-mono text-[18px] font-semibold text-phantom-text tabular-nums">
            {counts.all}
          </span>
        </div>
      </motion.div>

      {/* ---- Filters ---- */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.25 }}
      >
        <TaskFilters
          activeFilter={activeFilter}
          activeSort={activeSort}
          onFilterChange={setActiveFilter}
          onSortChange={setActiveSort}
          counts={counts}
        />
      </motion.div>

      {/* ---- Task List ---- */}
      {loading ? (
        <TasksSkeleton />
      ) : displayTasks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn(
            "flex flex-col items-center justify-center py-16",
            "text-center"
          )}
        >
          <Inbox className="w-10 h-10 text-phantom-textMuted mb-3" />
          <p className="text-body text-phantom-textSecondary mb-1">
            No tasks match this filter
          </p>
          <p className="text-caption text-phantom-textMuted">
            Try switching to a different filter or check back later.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {displayTasks.map((task, i) => (
            <TaskCard key={task.id} task={task} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
