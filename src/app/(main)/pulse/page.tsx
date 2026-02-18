"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Users,
  TrendingUp,
  Zap,
  Trophy,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { CampusPulseData, CoursePulseData } from "@/types";

/* -------------------------------------------------------------------------- */
/*  Animated Counter                                                           */
/* -------------------------------------------------------------------------- */

function AnimatedCounter({
  target,
  duration = 2000,
  prefix = "",
  suffix = "",
  decimals = 0,
}: {
  target: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const start = performance.now();
    const step = (timestamp: number) => {
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(eased * target);
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [target, duration]);

  const display = decimals > 0 ? count.toFixed(decimals) : Math.round(count);

  return (
    <span className="tabular-nums">
      {prefix}
      {typeof display === "number" ? display.toLocaleString() : display}
      {suffix}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Stat Card                                                                  */
/* -------------------------------------------------------------------------- */

interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  icon: React.ElementType;
  trend?: number;
  subtitle?: string;
  index: number;
}

function StatCard({
  label,
  value,
  suffix,
  prefix,
  decimals,
  icon: Icon,
  trend,
  subtitle,
  index,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className={cn(
        "rounded-lg border border-phantom-border",
        "bg-phantom-bgCard p-5",
        "hover:border-phantom-borderHover hover:-translate-y-px",
        "transition-all duration-200"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className={cn(
            "w-9 h-9 rounded-lg",
            "bg-phantom-accentBg border border-phantom-border",
            "flex items-center justify-center"
          )}
        >
          <Icon className="w-4 h-4 text-phantom-textTertiary" />
        </div>
        {trend !== undefined && (
          <div
            className={cn(
              "flex items-center gap-0.5 text-[11px] font-mono",
              trend >= 0 ? "text-phantom-success" : "text-phantom-danger"
            )}
          >
            {trend >= 0 ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>

      <div className="text-xl-metric text-phantom-text mb-1">
        <AnimatedCounter
          target={value}
          prefix={prefix}
          suffix={suffix}
          decimals={decimals}
        />
      </div>
      <span className="text-label-mono text-phantom-textMuted uppercase">
        {label}
      </span>
      {subtitle && (
        <p className="text-caption text-phantom-textTertiary mt-1">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Course Pulse Row                                                           */
/* -------------------------------------------------------------------------- */

function CoursePulseRow({
  course,
  index,
}: {
  course: CoursePulseData;
  index: number;
}) {
  const percentage = Math.round(course.phantomPercentage);
  const gradeAdvantage =
    course.avgPhantomGrade != null && course.avgNonPhantomGrade != null
      ? course.avgPhantomGrade - course.avgNonPhantomGrade
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className={cn(
        "flex items-center gap-4 p-4 rounded-lg",
        "border border-phantom-border bg-phantom-bgCard",
        "hover:border-phantom-borderHover hover:-translate-y-px",
        "transition-all duration-200"
      )}
    >
      {/* Adoption Meter */}
      <div className="w-20 shrink-0">
        <div className="text-large-metric text-phantom-text text-center tabular-nums">
          <AnimatedCounter
            target={percentage}
            suffix="%"
            duration={1200 + index * 200}
          />
        </div>
        <div className="relative h-[3px] w-full bg-phantom-accentBg rounded-full mt-1.5 overflow-hidden">
          <motion.div
            className="h-full bg-phantom-text/70 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ delay: index * 0.06 + 0.3, duration: 0.6 }}
          />
        </div>
        <span className="text-micro text-phantom-textMuted block text-center mt-1">
          adoption
        </span>
      </div>

      {/* Course Info */}
      <div className="flex-1 min-w-0">
        <p className="text-card-title text-phantom-text truncate">
          Course {course.courseId.slice(0, 8)}
        </p>
        <div className="flex items-center gap-2 mt-1 text-caption text-phantom-textTertiary">
          <span>
            {course.phantomUsers}/{course.totalStudents} students
          </span>
          {course.topActions.length > 0 && (
            <div className="flex items-center gap-1">
              {course.topActions.slice(0, 2).map((action, i) => (
                <Badge key={i} variant="default" className="text-[9px]">
                  {action}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grade Comparison */}
      {gradeAdvantage != null && (
        <div className="text-right shrink-0">
          <div
            className={cn(
              "text-body font-mono font-bold",
              gradeAdvantage > 0
                ? "text-phantom-success"
                : gradeAdvantage < 0
                  ? "text-phantom-danger"
                  : "text-phantom-textMuted"
            )}
          >
            {gradeAdvantage > 0 ? "+" : ""}
            {gradeAdvantage.toFixed(1)}%
          </div>
          <span className="text-micro text-phantom-textMuted">
            vs non-Phantom
          </span>
        </div>
      )}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Leaderboard                                                                */
/* -------------------------------------------------------------------------- */

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  badge: string;
}

function Leaderboard({ entries }: { entries: LeaderboardEntry[] }) {
  return (
    <div className="space-y-1.5">
      {entries.map((entry, i) => (
        <motion.div
          key={entry.rank}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.2 }}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-md",
            "border border-phantom-border bg-phantom-bgCard",
            "hover:border-phantom-borderHover transition-all duration-200",
            i === 0 && "border-phantom-borderHover bg-phantom-bgCardHover"
          )}
        >
          <span
            className={cn(
              "w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold",
              i === 0
                ? "bg-phantom-text text-phantom-bg"
                : i < 3
                  ? "bg-phantom-accentBg text-phantom-textSecondary"
                  : "bg-phantom-accentBg text-phantom-textTertiary"
            )}
          >
            {entry.rank}
          </span>
          <span className="flex-1 text-body text-phantom-text truncate">
            {entry.name}
          </span>
          <Badge variant="default" className="text-[10px]">
            {entry.badge}
          </Badge>
          <span className="text-body font-mono text-phantom-textSecondary tabular-nums">
            {entry.score.toLocaleString()}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Loading Skeleton                                                           */
/* -------------------------------------------------------------------------- */

function PulseSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-phantom-border p-5 space-y-4"
          >
            <Skeleton className="w-9 h-9 rounded-lg" />
            <Skeleton className="h-12 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function PulsePage() {
  const [campusData, setCampusData] = useState<CampusPulseData | null>(null);
  const [courseData, setCourseData] = useState<CoursePulseData[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(true);

  useEffect(() => {
    async function fetchPulse() {
      try {
        const res = await fetch("/api/pulse/campus");
        if (res.ok) {
          const data = await res.json();
          setCampusData(data.campus || data);
          setCourseData(data.courses || []);
          setLeaderboard(data.leaderboard || []);
        }
      } catch (err) {
        console.error("Failed to fetch pulse data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPulse();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div>
          <h1 className="text-page-title text-phantom-text mb-1">
            Campus Pulse
          </h1>
          <p className="text-body text-phantom-textSecondary">
            Real-time campus analytics and Phantom adoption metrics.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-phantom-border ml-auto shrink-0">
          <div className="w-2 h-2 rounded-full bg-phantom-success animate-pulse-dot" />
          <span className="text-[11px] font-mono text-phantom-textTertiary">
            Live
          </span>
        </div>
      </div>

      {loading ? (
        <PulseSkeleton />
      ) : (
        <div className="space-y-8">
          {/* Campus-Wide Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Total Users"
              value={campusData?.totalUsers ?? 0}
              icon={Users}
              subtitle={
                campusData?.universityName
                  ? `at ${campusData.universityName}`
                  : undefined
              }
              index={0}
            />
            <StatCard
              label="Active Now"
              value={campusData?.activeUsers ?? 0}
              icon={Zap}
              subtitle="students using Phantom right now"
              index={1}
            />
            <StatCard
              label="Weekly Growth"
              value={campusData?.weeklyGrowth ?? 0}
              suffix="%"
              decimals={1}
              icon={TrendingUp}
              trend={campusData?.weeklyGrowth}
              subtitle="new students this week"
              index={2}
            />
          </div>

          {/* Course-Level Heading */}
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-phantom-textMuted" />
            <span className="text-label-mono text-phantom-textMuted uppercase">
              {campusData?.universityName
                ? `${campusData.universityName} -- Course Adoption`
                : "Course Adoption"}
            </span>
          </div>

          {/* Course-Level Pulse */}
          {courseData.length > 0 ? (
            <div className="space-y-2">
              {courseData.map((course, i) => (
                <CoursePulseRow
                  key={course.courseId}
                  course={course}
                  index={i}
                />
              ))}
            </div>
          ) : (
            <div
              className={cn(
                "py-12 text-center rounded-lg",
                "border border-dashed border-phantom-border"
              )}
            >
              <BarChart3 className="w-8 h-8 text-phantom-textMuted mx-auto mb-3" />
              <p className="text-body text-phantom-textSecondary">
                No course data available yet.
              </p>
              <p className="text-caption text-phantom-textMuted mt-1">
                Course-level stats will appear once enough students at your
                university are using Phantom (minimum 20% adoption per course
                for anonymity).
              </p>
            </div>
          )}

          {/* Leaderboard */}
          {leaderboard.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-phantom-textTertiary" />
                  <h2 className="text-section-heading text-phantom-text">
                    Leaderboard
                  </h2>
                  <Badge variant="default" className="text-[10px]">
                    Opt-In
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLeaderboard(!showLeaderboard)}
                >
                  {showLeaderboard ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      Hide
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      Show
                    </>
                  )}
                </Button>
              </div>

              {showLeaderboard && <Leaderboard entries={leaderboard} />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
