"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GripVertical, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLetterGrade, getGpaFromLetter, getGradeColor } from "@/lib/utils";
import type { GpaCourseData } from "@/types";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface CourseBreakdownProps {
  courses: GpaCourseData[];
  currentGpa: number;
}

interface SliderCourse extends GpaCourseData {
  adjustedGrade: number;
  adjustedLetter: string;
  adjustedGpaPoints: number;
}

/* -------------------------------------------------------------------------- */
/*  Grade Scale Constants                                                      */
/* -------------------------------------------------------------------------- */

const GRADE_THRESHOLDS = [
  { min: 93, letter: "A", points: 4.0 },
  { min: 90, letter: "A-", points: 3.7 },
  { min: 87, letter: "B+", points: 3.3 },
  { min: 83, letter: "B", points: 3.0 },
  { min: 80, letter: "B-", points: 2.7 },
  { min: 77, letter: "C+", points: 2.3 },
  { min: 73, letter: "C", points: 2.0 },
  { min: 70, letter: "C-", points: 1.7 },
  { min: 67, letter: "D+", points: 1.3 },
  { min: 63, letter: "D", points: 1.0 },
  { min: 60, letter: "D-", points: 0.7 },
  { min: 0, letter: "F", points: 0.0 },
];

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getGpaPointsFromPercentage(pct: number): number {
  for (const t of GRADE_THRESHOLDS) {
    if (pct >= t.min) return t.points;
  }
  return 0;
}

function calculateWeightedGpa(courses: SliderCourse[]): number {
  const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);
  if (totalCredits === 0) return 0;
  const totalPoints = courses.reduce(
    (sum, c) => sum + c.credits * c.adjustedGpaPoints,
    0
  );
  return Math.round((totalPoints / totalCredits) * 100) / 100;
}

/* -------------------------------------------------------------------------- */
/*  Slider Row Component                                                       */
/* -------------------------------------------------------------------------- */

interface SliderRowProps {
  course: SliderCourse;
  originalGrade: number;
  onGradeChange: (id: string, grade: number) => void;
  onReset: (id: string) => void;
  isModified: boolean;
}

function SliderRow({
  course,
  originalGrade,
  onGradeChange,
  onReset,
  isModified,
}: SliderRowProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onGradeChange(course.id, Number(e.target.value));
    },
    [course.id, onGradeChange]
  );

  const gradeColor = getGradeColor(course.adjustedLetter);
  const contributionPerCredit = course.adjustedGpaPoints;
  const barWidth = (contributionPerCredit / 4.0) * 100;

  return (
    <motion.tr
      layout
      className={cn(
        "group border-b border-phantom-border/50 last:border-0",
        "transition-colors duration-150",
        isDragging
          ? "bg-phantom-accentBg"
          : "hover:bg-phantom-bgCardHover/50"
      )}
    >
      {/* Course Name */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <GripVertical className="w-3.5 h-3.5 text-phantom-textMuted opacity-0 group-hover:opacity-100 transition-opacity" />
          <div>
            <p className="text-body font-medium text-phantom-text">
              {course.name}
            </p>
            <p className="text-micro text-phantom-textMuted">{course.code}</p>
          </div>
        </div>
      </td>

      {/* Letter Grade */}
      <td className="py-3 px-4 text-center">
        <motion.span
          key={course.adjustedLetter}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.15 }}
          className={cn(
            "font-mono text-[15px] font-bold",
            gradeColor
          )}
        >
          {course.adjustedLetter}
        </motion.span>
      </td>

      {/* Percentage */}
      <td className="py-3 px-4 text-center">
        <motion.span
          key={course.adjustedGrade}
          initial={{ y: -2, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.1 }}
          className={cn(
            "font-mono text-body tabular-nums",
            isModified ? "text-phantom-text" : "text-phantom-textSecondary"
          )}
        >
          {course.adjustedGrade.toFixed(1)}%
        </motion.span>
      </td>

      {/* Credits */}
      <td className="py-3 px-4 text-center">
        <span className="font-mono text-body text-phantom-textSecondary">
          {course.credits}
        </span>
      </td>

      {/* GPA Contribution */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-[3px] rounded-full bg-phantom-accentBg overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-phantom-text/60"
              initial={false}
              animate={{ width: `${barWidth}%` }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>
          <span className="font-mono text-micro text-phantom-textTertiary w-8 text-right tabular-nums">
            {course.adjustedGpaPoints.toFixed(1)}
          </span>
        </div>
      </td>

      {/* What-If Slider */}
      <td className="py-3 px-4 min-w-[180px]">
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={100}
            step={0.5}
            value={course.adjustedGrade}
            onChange={handleChange}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={() => setIsDragging(false)}
            className={cn(
              "w-full h-[3px] rounded-full appearance-none cursor-pointer",
              "bg-phantom-accentBg outline-none",
              "[&::-webkit-slider-thumb]:appearance-none",
              "[&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4",
              "[&::-webkit-slider-thumb]:rounded-full",
              "[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-phantom-text",
              "[&::-webkit-slider-thumb]:bg-phantom-bgCard",
              "[&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing",
              "[&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150",
              "[&::-webkit-slider-thumb]:hover:scale-125",
              "[&::-webkit-slider-thumb]:active:scale-110",
              "[&::-webkit-slider-thumb]:shadow-phantom-sm",
              "[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4",
              "[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2",
              "[&::-moz-range-thumb]:border-phantom-text",
              "[&::-moz-range-thumb]:bg-phantom-bgCard",
              "[&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:active:cursor-grabbing"
            )}
            style={{
              background: `linear-gradient(to right, var(--phantom-text) 0%, var(--phantom-text) ${course.adjustedGrade}%, var(--phantom-border) ${course.adjustedGrade}%, var(--phantom-border) 100%)`,
            }}
          />
          {isModified && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => onReset(course.id)}
              className={cn(
                "shrink-0 w-6 h-6 rounded-full",
                "flex items-center justify-center",
                "text-phantom-textMuted hover:text-phantom-text",
                "hover:bg-phantom-accentBg",
                "transition-colors duration-150"
              )}
              title="Reset to original"
            >
              <RotateCcw className="w-3 h-3" />
            </motion.button>
          )}
        </div>
      </td>
    </motion.tr>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Component                                                             */
/* -------------------------------------------------------------------------- */

export function CourseBreakdown({ courses, currentGpa }: CourseBreakdownProps) {
  /* Build adjustable state from course data */
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});

  const sliderCourses: SliderCourse[] = useMemo(
    () =>
      courses.map((c) => {
        const adjustedGrade =
          adjustments[c.id] ?? c.currentGrade ?? 0;
        const adjustedLetter = getLetterGrade(adjustedGrade);
        const adjustedGpaPoints = getGpaPointsFromPercentage(adjustedGrade);
        return {
          ...c,
          adjustedGrade,
          adjustedLetter,
          adjustedGpaPoints,
        };
      }),
    [courses, adjustments]
  );

  const projectedGpa = useMemo(
    () => calculateWeightedGpa(sliderCourses),
    [sliderCourses]
  );

  const gpaDelta = projectedGpa - currentGpa;
  const hasModifications = Object.keys(adjustments).length > 0;

  const handleGradeChange = useCallback((id: string, grade: number) => {
    setAdjustments((prev) => ({ ...prev, [id]: grade }));
  }, []);

  const handleReset = useCallback((id: string) => {
    setAdjustments((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const handleResetAll = useCallback(() => {
    setAdjustments({});
  }, []);

  return (
    <div className="space-y-4">
      {/* ---- Projected GPA Bar ---- */}
      <div
        className={cn(
          "flex items-center justify-between",
          "rounded-lg border px-5 py-3",
          hasModifications
            ? "border-phantom-borderHover bg-phantom-accentBg"
            : "border-phantom-border bg-phantom-bgTertiary/30"
        )}
      >
        <div className="flex items-center gap-3">
          <span className="text-label-mono text-phantom-textMuted uppercase">
            {hasModifications ? "Projected GPA" : "Current GPA"}
          </span>
          <AnimatePresence mode="wait">
            <motion.span
              key={projectedGpa.toFixed(2)}
              initial={{ y: -6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 6, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="font-mono text-[28px] font-bold text-phantom-text tracking-[-0.03em]"
            >
              {projectedGpa.toFixed(2)}
            </motion.span>
          </AnimatePresence>

          {hasModifications && (
            <motion.span
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "font-mono text-[13px] font-medium",
                gpaDelta > 0
                  ? "text-phantom-success"
                  : gpaDelta < 0
                  ? "text-phantom-danger"
                  : "text-phantom-textMuted"
              )}
            >
              {gpaDelta > 0 ? "+" : ""}
              {gpaDelta.toFixed(2)}
            </motion.span>
          )}
        </div>

        {hasModifications && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={handleResetAll}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-sm",
              "text-caption text-phantom-textSecondary",
              "border border-phantom-border",
              "hover:bg-phantom-bgCard hover:border-phantom-borderHover",
              "transition-all duration-150",
              "active:scale-[0.97]"
            )}
          >
            <RotateCcw className="w-3 h-3" />
            Reset All
          </motion.button>
        )}
      </div>

      {/* ---- Course Table ---- */}
      <div className="overflow-x-auto rounded-lg border border-phantom-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-phantom-border bg-phantom-bgTertiary/30">
              <th className="py-2.5 px-4 text-left text-label-mono text-phantom-textMuted uppercase font-medium">
                Course
              </th>
              <th className="py-2.5 px-4 text-center text-label-mono text-phantom-textMuted uppercase font-medium">
                Grade
              </th>
              <th className="py-2.5 px-4 text-center text-label-mono text-phantom-textMuted uppercase font-medium">
                Pct
              </th>
              <th className="py-2.5 px-4 text-center text-label-mono text-phantom-textMuted uppercase font-medium">
                Cr
              </th>
              <th className="py-2.5 px-4 text-left text-label-mono text-phantom-textMuted uppercase font-medium">
                Contribution
              </th>
              <th className="py-2.5 px-4 text-left text-label-mono text-phantom-textMuted uppercase font-medium">
                What-If
              </th>
            </tr>
          </thead>
          <tbody>
            {sliderCourses.map((course) => (
              <SliderRow
                key={course.id}
                course={course}
                originalGrade={
                  courses.find((c) => c.id === course.id)?.currentGrade ?? 0
                }
                onGradeChange={handleGradeChange}
                onReset={handleReset}
                isModified={adjustments[course.id] !== undefined}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* ---- Hint ---- */}
      <p className="text-micro text-phantom-textMuted text-center">
        Drag the sliders to see how grade changes affect your GPA in real-time
      </p>
    </div>
  );
}
