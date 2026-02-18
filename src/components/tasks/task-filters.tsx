"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ChevronDown,
  ArrowUpDown,
  Calendar,
  AlertTriangle,
  FileCheck,
  Clock,
  Layers,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export type TaskFilter =
  | "all"
  | "due_today"
  | "due_week"
  | "draft_ready"
  | "overdue";

export type TaskSort =
  | "due_date"
  | "priority"
  | "course"
  | "gpa_impact";

interface TaskFiltersProps {
  activeFilter: TaskFilter;
  activeSort: TaskSort;
  onFilterChange: (filter: TaskFilter) => void;
  onSortChange: (sort: TaskSort) => void;
  counts?: Record<TaskFilter, number>;
}

/* -------------------------------------------------------------------------- */
/*  Filter Config                                                              */
/* -------------------------------------------------------------------------- */

const FILTERS: {
  value: TaskFilter;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "all", label: "All", icon: Layers },
  { value: "due_today", label: "Due Today", icon: Calendar },
  { value: "due_week", label: "This Week", icon: Clock },
  { value: "draft_ready", label: "Draft Ready", icon: FileCheck },
  { value: "overdue", label: "Overdue", icon: AlertTriangle },
];

const SORT_OPTIONS: { value: TaskSort; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "due_date", label: "Due Date", icon: Calendar },
  { value: "priority", label: "Priority", icon: AlertTriangle },
  { value: "course", label: "Course", icon: Layers },
  { value: "gpa_impact", label: "GPA Impact", icon: TrendingUp },
];

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function TaskFilters({
  activeFilter,
  activeSort,
  onFilterChange,
  onSortChange,
  counts,
}: TaskFiltersProps) {
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  /* Close sort dropdown on outside click */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    }
    if (sortOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [sortOpen]);

  const activeSortOption = SORT_OPTIONS.find((s) => s.value === activeSort);

  return (
    <div className="flex items-center justify-between gap-4">
      {/* ---- Filter Pills ---- */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter.value;
          const Icon = filter.icon;
          const count = counts?.[filter.value];

          return (
            <button
              key={filter.value}
              onClick={() => onFilterChange(filter.value)}
              className={cn(
                "relative inline-flex items-center gap-1.5",
                "px-3 py-1.5 rounded-full",
                "text-caption font-medium whitespace-nowrap",
                "transition-all duration-200 ease-out",
                "select-none",
                isActive
                  ? "bg-phantom-text text-phantom-bg"
                  : "bg-transparent border border-phantom-border text-phantom-textTertiary hover:text-phantom-text hover:border-phantom-borderHover"
              )}
            >
              <Icon className="w-3 h-3" />
              <span>{filter.label}</span>
              {count != null && count > 0 && (
                <span
                  className={cn(
                    "font-mono text-[10px] tabular-nums",
                    isActive
                      ? "text-phantom-bg/70"
                      : "text-phantom-textMuted"
                  )}
                >
                  {count}
                </span>
              )}

              {/* Active indicator underline (invisible but present for layout) */}
              {isActive && (
                <motion.div
                  layoutId="activeFilter"
                  className="absolute inset-0 rounded-full bg-phantom-text -z-10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ---- Sort Dropdown ---- */}
      <div ref={sortRef} className="relative shrink-0">
        <button
          onClick={() => setSortOpen(!sortOpen)}
          className={cn(
            "inline-flex items-center gap-1.5",
            "px-3 py-1.5 rounded-sm",
            "text-caption text-phantom-textSecondary",
            "border border-phantom-border",
            "hover:border-phantom-borderHover hover:text-phantom-text",
            "transition-all duration-150"
          )}
        >
          <ArrowUpDown className="w-3 h-3 text-phantom-textMuted" />
          <span>{activeSortOption?.label ?? "Sort"}</span>
          <ChevronDown
            className={cn(
              "w-3 h-3 text-phantom-textMuted transition-transform duration-150",
              sortOpen && "rotate-180"
            )}
          />
        </button>

        {sortOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.12 }}
            className={cn(
              "absolute right-0 top-full mt-1 z-50",
              "w-[160px] rounded-md",
              "border border-phantom-border",
              "bg-phantom-bgCard shadow-phantom-lg",
              "py-1"
            )}
          >
            {SORT_OPTIONS.map((option) => {
              const isActive = activeSort === option.value;
              const SortIcon = option.icon;

              return (
                <button
                  key={option.value}
                  onClick={() => {
                    onSortChange(option.value);
                    setSortOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-1.5",
                    "text-body transition-colors duration-100",
                    isActive
                      ? "bg-phantom-accentBg text-phantom-text font-medium"
                      : "text-phantom-textSecondary hover:bg-phantom-bgCardHover hover:text-phantom-text"
                  )}
                >
                  <SortIcon className="w-3.5 h-3.5 text-phantom-textMuted" />
                  {option.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
