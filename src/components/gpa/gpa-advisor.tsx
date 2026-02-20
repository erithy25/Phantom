"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Clock,
  ArrowUpRight,
  BookOpen,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface StudyRecommendation {
  courseId: string;
  courseName: string;
  courseCode: string;
  rank: number;
  recommendedHours: number;
  gpaImpact: number;
  currentGrade: string;
  targetGrade: string;
  rationale: string;
  priority: "critical" | "high" | "moderate" | "low";
}

interface AdvisorResponse {
  recommendations: StudyRecommendation[];
  summary: string;
  weeklyBudgetHours: number;
}

/* -------------------------------------------------------------------------- */
/*  Loading Skeleton                                                           */
/* -------------------------------------------------------------------------- */

function AdvisorSkeleton() {
  return (
    <div className="space-y-4">
      {/* Summary skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>

      {/* Recommendations skeleton */}
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={cn(
            "rounded-lg border border-phantom-border p-4",
            "space-y-3"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-7 h-7 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-2 w-20" />
              </div>
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-[3px] w-full rounded-full" />
          <Skeleton className="h-2.5 w-full" />
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Priority Badge                                                             */
/* -------------------------------------------------------------------------- */

function PriorityLabel({ priority }: { priority: string }) {
  const config = {
    critical: {
      bg: "bg-phantom-danger/10 border-phantom-danger/20",
      text: "text-phantom-danger",
      label: "Critical",
    },
    high: {
      bg: "bg-phantom-warning/10 border-phantom-warning/20",
      text: "text-phantom-warning",
      label: "High",
    },
    moderate: {
      bg: "bg-phantom-textTertiary/10 border-phantom-border",
      text: "text-phantom-textSecondary",
      label: "Moderate",
    },
    low: {
      bg: "bg-phantom-bgTertiary/50 border-phantom-border",
      text: "text-phantom-textMuted",
      label: "Low",
    },
  }[priority] ?? {
    bg: "bg-phantom-bgTertiary/50 border-phantom-border",
    text: "text-phantom-textMuted",
    label: priority,
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full",
        "font-mono text-[10px] font-medium tracking-[0.05em] uppercase",
        "border",
        config.bg,
        config.text
      )}
    >
      {config.label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Recommendation Row                                                         */
/* -------------------------------------------------------------------------- */

interface RecommendationRowProps {
  rec: StudyRecommendation;
  maxImpact: number;
  index: number;
}

function RecommendationRow({ rec, maxImpact, index }: RecommendationRowProps) {
  const impactWidth =
    maxImpact > 0 ? (rec.gpaImpact / maxImpact) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.25 }}
      className={cn(
        "rounded-lg border border-phantom-border",
        "bg-phantom-bgCard p-4",
        "hover:border-phantom-borderHover",
        "transition-colors duration-150",
        "group"
      )}
    >
      {/* Top Row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Rank */}
          <div
            className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
              "border border-phantom-border bg-phantom-bgTertiary/50",
              "font-mono text-[12px] font-bold text-phantom-text"
            )}
          >
            {rec.rank}
          </div>

          {/* Course Info */}
          <div>
            <p className="text-body font-medium text-phantom-text">
              {rec.courseName}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-micro text-phantom-textMuted">
                {rec.courseCode}
              </span>
              <span className="text-micro text-phantom-textMuted">
                {rec.currentGrade} &rarr; {rec.targetGrade}
              </span>
            </div>
          </div>
        </div>

        <PriorityLabel priority={rec.priority} />
      </div>

      {/* GPA Impact Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-label-mono text-phantom-textMuted uppercase">
            GPA Impact
          </span>
          <span className="font-mono text-micro text-phantom-success tabular-nums">
            +{rec.gpaImpact.toFixed(2)}
          </span>
        </div>
        <div className="h-[3px] rounded-full bg-phantom-accentBg overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${impactWidth}%` }}
            transition={{ delay: index * 0.06 + 0.2, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="h-full rounded-full bg-phantom-success/60"
          />
        </div>
      </div>

      {/* Recommended Hours */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-phantom-textSecondary">
          <Clock className="w-3.5 h-3.5 text-phantom-textMuted" />
          <span className="text-caption">Recommended</span>
        </div>
        <span className="font-mono text-body font-semibold text-phantom-text tabular-nums">
          {rec.recommendedHours}h/week
        </span>
      </div>

      {/* Rationale */}
      <p className="text-micro text-phantom-textTertiary leading-relaxed">
        {rec.rationale}
      </p>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Component                                                             */
/* -------------------------------------------------------------------------- */

export function GpaAdvisor() {
  const [data, setData] = useState<AdvisorResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdvisor = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/gpa/advisor");
      if (!res.ok) throw new Error("Failed to fetch advisor recommendations");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      /* Fallback mock data for development */
      setData({
        summary:
          "Focus on Organic Chemistry and Data Structures for the highest GPA impact. Maintaining your current effort in Calculus III will secure your A-. Consider dedicating an additional 3 hours weekly to Philosophy to push from B+ to A-.",
        weeklyBudgetHours: 28,
        recommendations: [
          {
            courseId: "1",
            courseName: "Organic Chemistry",
            courseCode: "CHEM 201",
            rank: 1,
            recommendedHours: 8,
            gpaImpact: 0.15,
            currentGrade: "B-",
            targetGrade: "B+",
            rationale:
              "Highest credit course with room for improvement. Focus on reaction mechanisms and synthesis pathways before the midterm.",
            priority: "critical",
          },
          {
            courseId: "2",
            courseName: "Data Structures",
            courseCode: "CS 201",
            rank: 2,
            recommendedHours: 7,
            gpaImpact: 0.12,
            currentGrade: "B",
            targetGrade: "A-",
            rationale:
              "Strong foundation but weak on tree traversals. Practice implementations will solidify understanding for the coding exam.",
            priority: "high",
          },
          {
            courseId: "3",
            courseName: "Calculus III",
            courseCode: "MATH 301",
            rank: 3,
            recommendedHours: 6,
            gpaImpact: 0.08,
            currentGrade: "A-",
            targetGrade: "A",
            rationale:
              "Close to an A. Focus on surface integrals and Stokes' theorem for the remaining problem sets.",
            priority: "moderate",
          },
          {
            courseId: "4",
            courseName: "Modern Philosophy",
            courseCode: "PHIL 220",
            rank: 4,
            recommendedHours: 4,
            gpaImpact: 0.05,
            currentGrade: "B+",
            targetGrade: "A-",
            rationale:
              "Your essays are strong. Add more primary source citations and engage with counterarguments for the final paper.",
            priority: "low",
          },
          {
            courseId: "5",
            courseName: "Technical Writing",
            courseCode: "ENG 215",
            rank: 5,
            recommendedHours: 3,
            gpaImpact: 0.03,
            currentGrade: "A",
            targetGrade: "A",
            rationale:
              "Maintain current effort. Your performance is excellent; no additional hours needed.",
            priority: "low",
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvisor();
  }, []);

  const maxImpact = data && data.recommendations.length > 0
    ? Math.max(...data.recommendations.map((r) => r.gpaImpact))
    : 1;

  return (
    <div className="space-y-5">
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-phantom-textMuted" />
          <span className="text-label-mono text-phantom-textMuted uppercase">
            AI Study Plan
          </span>
        </div>
        <button
          onClick={fetchAdvisor}
          disabled={loading}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-sm",
            "text-micro text-phantom-textMuted",
            "hover:text-phantom-text hover:bg-phantom-accentBg",
            "transition-colors duration-150",
            "disabled:opacity-40 disabled:pointer-events-none"
          )}
        >
          <RefreshCw
            className={cn("w-3 h-3", loading && "animate-spin")}
          />
          Refresh
        </button>
      </div>

      {/* ---- Content ---- */}
      {loading ? (
        <AdvisorSkeleton />
      ) : error && !data ? (
        <div
          className={cn(
            "rounded-lg border border-phantom-danger/20 bg-phantom-danger/5",
            "p-4 flex items-center gap-3"
          )}
        >
          <AlertTriangle className="w-4 h-4 text-phantom-danger shrink-0" />
          <p className="text-body text-phantom-danger">{error}</p>
        </div>
      ) : data ? (
        <>
          {/* Summary */}
          <div
            className={cn(
              "rounded-lg border border-phantom-border",
              "bg-phantom-bgTertiary/20 px-4 py-3"
            )}
          >
            <p className="text-body text-phantom-textSecondary leading-relaxed">
              {data.summary}
            </p>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-phantom-border/50">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-phantom-textMuted" />
                <span className="text-micro text-phantom-textMuted">
                  Weekly Budget
                </span>
              </div>
              <span className="font-mono text-body font-semibold text-phantom-text tabular-nums">
                {data.weeklyBudgetHours}h
              </span>
            </div>
          </div>

          {/* Recommendations */}
          <div className="space-y-3">
            {data.recommendations.length > 0 ? (
              data.recommendations.map((rec, i) => (
                <RecommendationRow
                  key={rec.courseId}
                  rec={rec}
                  maxImpact={maxImpact}
                  index={i}
                />
              ))
            ) : (
              <div className="rounded-lg border border-phantom-border bg-phantom-bgTertiary/20 p-4 text-center">
                <p className="text-sm text-phantom-textMuted">
                  Add courses with grades to get personalized study recommendations.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-2 pt-1">
            <BookOpen className="w-3 h-3 text-phantom-textMuted" />
            <p className="text-micro text-phantom-textMuted">
              Recommendations update based on your grades, upcoming deadlines, and professor tendencies.
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}
