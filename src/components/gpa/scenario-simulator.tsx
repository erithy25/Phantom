"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Save,
  Copy,
  ChevronDown,
  Sparkles,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getGpaFromLetter } from "@/lib/utils";
import type { GpaCourseData, GpaScenario } from "@/types";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface ScenarioSimulatorProps {
  courses: GpaCourseData[];
  currentGpa: number;
  savedScenarios?: GpaScenario[];
}

interface LocalScenario {
  id: string;
  name: string;
  courseGrades: Record<string, string>;
  isSaving?: boolean;
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const LETTER_GRADES = [
  "A",
  "A-",
  "B+",
  "B",
  "B-",
  "C+",
  "C",
  "C-",
  "D+",
  "D",
  "D-",
  "F",
];

const GRADE_TO_PROBABILITY: Record<string, number> = {
  A: 0.15,
  "A-": 0.25,
  "B+": 0.45,
  B: 0.65,
  "B-": 0.75,
  "C+": 0.82,
  C: 0.88,
  "C-": 0.92,
  "D+": 0.95,
  D: 0.97,
  "D-": 0.98,
  F: 1.0,
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function computeScenarioGpa(
  courses: GpaCourseData[],
  grades: Record<string, string>
): number {
  let totalCredits = 0;
  let totalPoints = 0;
  for (const c of courses) {
    const letter = grades[c.id] || c.letterGrade || "C";
    const pts = getGpaFromLetter(letter);
    totalCredits += c.credits;
    totalPoints += c.credits * pts;
  }
  if (totalCredits === 0) return 0;
  return Math.round((totalPoints / totalCredits) * 100) / 100;
}

function computeProbability(
  courses: GpaCourseData[],
  grades: Record<string, string>
): number {
  let total = 0;
  let count = 0;
  for (const c of courses) {
    const targetLetter = grades[c.id];
    if (!targetLetter) continue;
    const currentLetter = c.letterGrade || "C";

    const currentIdx = LETTER_GRADES.indexOf(currentLetter);
    const targetIdx = LETTER_GRADES.indexOf(targetLetter);

    /* Easier to maintain or go lower; harder to improve */
    if (targetIdx >= currentIdx) {
      /* same or lower grade - high probability */
      total += 0.85 + (targetIdx - currentIdx) * 0.02;
    } else {
      /* trying to improve - scale down based on gap */
      const gap = currentIdx - targetIdx;
      total += Math.max(0.1, 0.85 - gap * 0.15);
    }
    count++;
  }
  if (count === 0) return 0;
  return Math.round((total / count) * 100);
}

function generateId() {
  return `scn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/* -------------------------------------------------------------------------- */
/*  Grade Selector Dropdown                                                    */
/* -------------------------------------------------------------------------- */

function GradeSelect({
  value,
  onChange,
  currentGrade,
}: {
  value: string;
  onChange: (v: string) => void;
  currentGrade: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center justify-between gap-1",
          "w-[72px] h-8 px-2 rounded-sm",
          "border border-phantom-border",
          "bg-phantom-bgInput text-phantom-text",
          "font-mono text-[13px] font-semibold",
          "hover:border-phantom-borderHover",
          "transition-colors duration-150"
        )}
      >
        <span>{value}</span>
        <ChevronDown
          className={cn(
            "w-3 h-3 text-phantom-textMuted transition-transform duration-150",
            open && "rotate-180"
          )}
        />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              className={cn(
                "absolute top-full left-0 mt-1 z-50",
                "w-[72px] max-h-[220px] overflow-y-auto",
                "rounded-md border border-phantom-border",
                "bg-phantom-bgCard shadow-phantom-lg",
                "py-1"
              )}
            >
              {LETTER_GRADES.map((grade) => (
                <button
                  key={grade}
                  onClick={() => {
                    onChange(grade);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full px-2 py-1 text-left",
                    "font-mono text-[12px]",
                    "transition-colors duration-100",
                    grade === value
                      ? "bg-phantom-accentBg text-phantom-text font-semibold"
                      : "text-phantom-textSecondary hover:bg-phantom-bgCardHover hover:text-phantom-text",
                    grade === currentGrade &&
                      grade !== value &&
                      "text-phantom-textTertiary"
                  )}
                >
                  {grade}
                  {grade === currentGrade && (
                    <span className="text-phantom-textMuted ml-1 text-[10px]">
                      now
                    </span>
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Scenario Card                                                              */
/* -------------------------------------------------------------------------- */

interface ScenarioCardProps {
  scenario: LocalScenario;
  courses: GpaCourseData[];
  currentGpa: number;
  onUpdate: (id: string, grades: Record<string, string>) => void;
  onDelete: (id: string) => void;
  onSave: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string, name: string) => void;
  isComparing: boolean;
}

function ScenarioCard({
  scenario,
  courses,
  currentGpa,
  onUpdate,
  onDelete,
  onSave,
  onDuplicate,
  onRename,
  isComparing,
}: ScenarioCardProps) {
  const resultGpa = computeScenarioGpa(courses, scenario.courseGrades);
  const delta = resultGpa - currentGpa;
  const probability = computeProbability(courses, scenario.courseGrades);

  const handleGradeChange = useCallback(
    (courseId: string, grade: string) => {
      onUpdate(scenario.id, {
        ...scenario.courseGrades,
        [courseId]: grade,
      });
    },
    [scenario.id, scenario.courseGrades, onUpdate]
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -8 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "rounded-lg border border-phantom-border",
        "bg-phantom-bgCard",
        isComparing ? "flex-1 min-w-[320px]" : "w-full"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-phantom-border/50">
        <input
          type="text"
          value={scenario.name}
          onChange={(e) => onRename(scenario.id, e.target.value)}
          className={cn(
            "bg-transparent text-card-title text-phantom-text",
            "font-semibold outline-none",
            "border-b border-transparent focus:border-phantom-borderHover",
            "transition-colors duration-150",
            "w-auto max-w-[200px]"
          )}
        />
        <div className="flex items-center gap-1">
          <button
            onClick={() => onDuplicate(scenario.id)}
            className="p-1.5 rounded-sm text-phantom-textMuted hover:text-phantom-text hover:bg-phantom-accentBg transition-colors"
            title="Duplicate scenario"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSave(scenario.id)}
            className="p-1.5 rounded-sm text-phantom-textMuted hover:text-phantom-text hover:bg-phantom-accentBg transition-colors"
            title="Save scenario"
          >
            <Save className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(scenario.id)}
            className="p-1.5 rounded-sm text-phantom-textMuted hover:text-phantom-danger hover:bg-phantom-danger/10 transition-colors"
            title="Delete scenario"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Course Grades */}
      <div className="px-4 py-3 space-y-2">
        {courses.map((course) => (
          <div
            key={course.id}
            className="flex items-center justify-between gap-3"
          >
            <div className="flex-1 min-w-0">
              <p className="text-body text-phantom-text truncate">
                {course.name}
              </p>
              <p className="text-micro text-phantom-textMuted">
                {course.credits} cr
              </p>
            </div>
            <GradeSelect
              value={
                scenario.courseGrades[course.id] ||
                course.letterGrade ||
                "C"
              }
              onChange={(grade) => handleGradeChange(course.id, grade)}
              currentGrade={course.letterGrade}
            />
          </div>
        ))}
      </div>

      {/* Result Footer */}
      <div className="px-4 py-3 border-t border-phantom-border/50 bg-phantom-bgTertiary/20 rounded-b-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-label-mono text-phantom-textMuted uppercase mb-0.5">
              Result
            </p>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[24px] font-bold text-phantom-text tracking-[-0.03em]">
                {resultGpa.toFixed(2)}
              </span>
              <span
                className={cn(
                  "font-mono text-[13px] font-medium",
                  delta > 0
                    ? "text-phantom-success"
                    : delta < 0
                    ? "text-phantom-danger"
                    : "text-phantom-textMuted"
                )}
              >
                {delta > 0 ? "+" : ""}
                {delta.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Probability */}
          <div className="text-right">
            <p className="text-label-mono text-phantom-textMuted uppercase mb-0.5">
              Probability
            </p>
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-phantom-textMuted" />
              <span
                className={cn(
                  "font-mono text-[18px] font-semibold",
                  probability >= 70
                    ? "text-phantom-success"
                    : probability >= 40
                    ? "text-phantom-warning"
                    : "text-phantom-danger"
                )}
              >
                {probability}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Component                                                             */
/* -------------------------------------------------------------------------- */

export function ScenarioSimulator({
  courses,
  currentGpa,
  savedScenarios = [],
}: ScenarioSimulatorProps) {
  const [scenarios, setScenarios] = useState<LocalScenario[]>(() => {
    if (savedScenarios.length > 0) {
      return savedScenarios.map((s) => ({
        id: s.id,
        name: s.name,
        courseGrades: s.courseGrades,
      }));
    }
    /* Start with one default "Best Case" scenario */
    const defaults: Record<string, string> = {};
    courses.forEach((c) => {
      defaults[c.id] = "A";
    });
    return [
      {
        id: generateId(),
        name: "Best Case",
        courseGrades: defaults,
      },
    ];
  });

  const [compareMode, setCompareMode] = useState(false);

  const handleAddScenario = useCallback(() => {
    const grades: Record<string, string> = {};
    courses.forEach((c) => {
      grades[c.id] = c.letterGrade || "C";
    });
    setScenarios((prev) => [
      ...prev,
      {
        id: generateId(),
        name: `Scenario ${prev.length + 1}`,
        courseGrades: grades,
      },
    ]);
  }, [courses]);

  const handleUpdate = useCallback(
    (id: string, grades: Record<string, string>) => {
      setScenarios((prev) =>
        prev.map((s) => (s.id === id ? { ...s, courseGrades: grades } : s))
      );
    },
    []
  );

  const handleDelete = useCallback((id: string) => {
    setScenarios((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleSave = useCallback(
    async (id: string) => {
      const scenario = scenarios.find((s) => s.id === id);
      if (!scenario) return;

      setScenarios((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isSaving: true } : s))
      );

      try {
        const resultGpa = computeScenarioGpa(courses, scenario.courseGrades);
        const probability = computeProbability(courses, scenario.courseGrades);

        await fetch("/api/gpa/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: scenario.name,
            courseGrades: scenario.courseGrades,
            resultGpa,
            probability,
          }),
        });
      } catch {
        /* Silently fail - the state is already local */
      } finally {
        setScenarios((prev) =>
          prev.map((s) => (s.id === id ? { ...s, isSaving: false } : s))
        );
      }
    },
    [scenarios, courses]
  );

  const handleDuplicate = useCallback(
    (id: string) => {
      const source = scenarios.find((s) => s.id === id);
      if (!source) return;
      setScenarios((prev) => [
        ...prev,
        {
          id: generateId(),
          name: `${source.name} (copy)`,
          courseGrades: { ...source.courseGrades },
        },
      ]);
    },
    [scenarios]
  );

  const handleRename = useCallback((id: string, name: string) => {
    setScenarios((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name } : s))
    );
  }, []);

  return (
    <div className="space-y-4">
      {/* ---- Controls ---- */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddScenario}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm",
              "text-caption font-medium text-phantom-text",
              "border border-phantom-border",
              "hover:bg-phantom-bgCard hover:border-phantom-borderHover",
              "transition-all duration-150 active:scale-[0.97]"
            )}
          >
            <Plus className="w-3.5 h-3.5" />
            New Scenario
          </button>

          {scenarios.length > 1 && (
            <button
              onClick={() => setCompareMode(!compareMode)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm",
                "text-caption font-medium",
                "border transition-all duration-150",
                compareMode
                  ? "border-phantom-text bg-phantom-text text-phantom-bg"
                  : "border-phantom-border text-phantom-textSecondary hover:bg-phantom-bgCard hover:border-phantom-borderHover"
              )}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Compare
            </button>
          )}
        </div>

        <span className="text-micro text-phantom-textMuted">
          {scenarios.length} scenario{scenarios.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ---- Scenario Cards ---- */}
      <div
        className={cn(
          compareMode
            ? "flex gap-4 overflow-x-auto pb-2"
            : "space-y-4"
        )}
      >
        <AnimatePresence mode="popLayout">
          {scenarios.map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              courses={courses}
              currentGpa={currentGpa}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onSave={handleSave}
              onDuplicate={handleDuplicate}
              onRename={handleRename}
              isComparing={compareMode}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
