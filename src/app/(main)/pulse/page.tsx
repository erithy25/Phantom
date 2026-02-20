"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users,
  TrendingUp,
  Zap,
  BookOpen,
  FileEdit,
  Lightbulb,
  Headphones,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

/* -------------------------------------------------------------------------- */
/*  Types for API response                                                     */
/* -------------------------------------------------------------------------- */

interface UniversityInfo {
  id: string;
  name: string;
  domain: string;
  studentCount: number | null;
  logoUrl: string | null;
}

interface PulseStats {
  totalPhantomUsers: number;
  activeUsersLast7Days: number;
  weeklyGrowth: number;
  totalDraftsGenerated: number;
  totalFlashcardsCreated: number;
  totalLecturesProcessed: number;
}

interface PopularCourse {
  code: string;
  name: string;
  studentCount: number;
}

interface PulseResponse {
  university: UniversityInfo | null;
  stats: PulseStats;
  popularCourses: PopularCourse[];
  pulseDate: string | null;
}

/* -------------------------------------------------------------------------- */
/*  Exact Number Display                                                       */
/* -------------------------------------------------------------------------- */

function ExactNumber({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("tabular-nums font-mono", className)}>
      {value.toLocaleString("de-DE")}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Stat Card                                                                  */
/* -------------------------------------------------------------------------- */

function StatCard({
  label,
  value,
  suffix,
  icon: Icon,
  description,
  index,
}: {
  label: string;
  value: number;
  suffix?: string;
  icon: React.ElementType;
  description?: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35 }}
      className={cn(
        "rounded-lg border border-phantom-border",
        "bg-phantom-bgCard p-5",
        "hover:border-phantom-borderHover hover:-translate-y-px",
        "transition-all duration-200"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className={cn(
            "w-9 h-9 rounded-lg",
            "bg-phantom-accentBg border border-phantom-border",
            "flex items-center justify-center"
          )}
        >
          <Icon className="w-4 h-4 text-phantom-textTertiary" />
        </div>
      </div>
      <div className="text-[28px] font-bold text-phantom-text leading-none mb-1">
        <ExactNumber value={value} />
        {suffix && <span className="text-lg text-phantom-textSecondary ml-0.5">{suffix}</span>}
      </div>
      <span className="text-[12px] font-medium uppercase tracking-wider text-phantom-textMuted">
        {label}
      </span>
      {description && (
        <p className="text-[11px] text-phantom-textTertiary mt-1">{description}</p>
      )}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Course Row                                                                 */
/* -------------------------------------------------------------------------- */

function CourseRow({ course, index }: { course: PopularCourse; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={cn(
        "flex items-center gap-4 p-4 rounded-lg",
        "border border-phantom-border bg-phantom-bgCard",
        "hover:border-phantom-borderHover hover:-translate-y-px",
        "transition-all duration-200"
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-md flex items-center justify-center text-[11px] font-bold",
          index === 0
            ? "bg-phantom-text text-phantom-bg"
            : index < 3
              ? "bg-phantom-accentBg text-phantom-textSecondary border border-phantom-border"
              : "bg-phantom-accentBg text-phantom-textTertiary border border-phantom-border"
        )}
      >
        {index + 1}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-phantom-text truncate">
          {course.name}
        </p>
        <p className="text-[11px] text-phantom-textTertiary font-mono">
          {course.code}
        </p>
      </div>

      <div className="text-right shrink-0">
        <div className="text-[15px] font-mono font-bold text-phantom-text tabular-nums">
          <ExactNumber value={course.studentCount} />
        </div>
        <span className="text-[10px] text-phantom-textMuted uppercase">
          Studenten
        </span>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Loading Skeleton                                                           */
/* -------------------------------------------------------------------------- */

function PulseSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-phantom-border p-5 space-y-4"
          >
            <Skeleton className="w-9 h-9 rounded-lg" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

const POLL_INTERVAL = 30_000; // 30s auto-refresh

export default function UniLivePage() {
  const [data, setData] = useState<PulseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPulse = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch("/api/pulse/campus", { cache: "no-store" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
      }
      const raw = await res.json();
      setData({
        university: raw.university || null,
        stats: {
          totalPhantomUsers: raw.stats?.totalPhantomUsers ?? 0,
          activeUsersLast7Days: raw.stats?.activeUsersLast7Days ?? 0,
          weeklyGrowth: raw.stats?.weeklyGrowth ?? 0,
          totalDraftsGenerated: raw.stats?.totalDraftsGenerated ?? 0,
          totalFlashcardsCreated: raw.stats?.totalFlashcardsCreated ?? 0,
          totalLecturesProcessed: raw.stats?.totalLecturesProcessed ?? 0,
        },
        popularCourses: raw.popularCourses ?? [],
        pulseDate: raw.pulseDate ?? null,
      });
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchPulse(true);
  }, [fetchPulse]);

  // Auto-refresh polling every 30s
  useEffect(() => {
    const interval = setInterval(() => fetchPulse(false), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchPulse]);

  const uniName = data?.university?.name || "Deine Uni";

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-page-title text-phantom-text mb-1">
            Uni Live
          </h1>
          <p className="text-body text-phantom-textSecondary">
            Echtzeit-Statistiken{data?.university?.name ? ` — ${data.university.name}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {lastUpdated && (
            <span className="text-[10px] font-mono text-phantom-textTertiary hidden sm:block">
              {lastUpdated.toLocaleTimeString("de-DE")}
            </span>
          )}
          <button
            onClick={() => fetchPulse(false)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md",
              "text-[11px] text-phantom-textMuted",
              "hover:text-phantom-text hover:bg-phantom-accentBg",
              "border border-phantom-border",
              "transition-colors duration-150"
            )}
          >
            <RefreshCw className="w-3 h-3" />
            Aktualisieren
          </button>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-phantom-success/30 bg-phantom-success/5">
            <div className="w-2 h-2 rounded-full bg-phantom-success animate-pulse" />
            <span className="text-[11px] font-mono text-phantom-success">
              Live
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <PulseSkeleton />
      ) : error && !data ? (
        <div className="rounded-lg border border-phantom-danger/20 bg-phantom-danger/5 p-6 text-center">
          <p className="text-body text-phantom-danger">{error}</p>
          <button
            onClick={() => fetchPulse(true)}
            className="mt-3 text-sm text-phantom-textSecondary hover:text-phantom-text underline"
          >
            Erneut versuchen
          </button>
        </div>
      ) : data ? (
        <div className="space-y-8">
          {/* Stats Grid - exact numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              label="Phantom Nutzer"
              value={data.stats.totalPhantomUsers}
              icon={Users}
              description={uniName}
              index={0}
            />
            <StatCard
              label="Aktiv (7 Tage)"
              value={data.stats.activeUsersLast7Days}
              icon={Zap}
              description="Aktive Nutzer der letzten Woche"
              index={1}
            />
            <StatCard
              label="Wachstum"
              value={data.stats.weeklyGrowth}
              suffix="%"
              icon={TrendingUp}
              description="Wachstum diese Woche"
              index={2}
            />
            <StatCard
              label="Erstellte Drafts"
              value={data.stats.totalDraftsGenerated}
              icon={FileEdit}
              description="Generierte Entwürfe"
              index={3}
            />
            <StatCard
              label="Karteikarten"
              value={data.stats.totalFlashcardsCreated}
              icon={Lightbulb}
              description="Erstellte Lernkarten"
              index={4}
            />
            <StatCard
              label="Vorlesungen"
              value={data.stats.totalLecturesProcessed}
              icon={Headphones}
              description="Verarbeitete Vorlesungen"
              index={5}
            />
          </div>

          {/* Popular Courses */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4 text-phantom-textMuted" />
              <h2 className="text-[13px] font-semibold uppercase tracking-wider text-phantom-textMuted">
                Top Kurse
              </h2>
              <span className="text-[11px] text-phantom-textTertiary font-mono ml-1">
                {data.popularCourses.length} Kurse
              </span>
            </div>

            {data.popularCourses.length > 0 ? (
              <div className="space-y-2">
                {data.popularCourses.map((course, i) => (
                  <CourseRow
                    key={`${course.code}-${i}`}
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
                  Noch keine Kursdaten vorhanden.
                </p>
                <p className="text-caption text-phantom-textMuted mt-1">
                  Kursdaten erscheinen, sobald genügend Studenten an deiner Uni Phantom nutzen.
                </p>
              </div>
            )}
          </div>

          {/* Uni Info Footer */}
          {data.university && (
            <div className="flex items-center gap-3 pt-4 border-t border-phantom-border">
              <div className="w-8 h-8 rounded-md bg-phantom-accentBg border border-phantom-border flex items-center justify-center">
                <span className="text-[11px] font-bold text-phantom-text">
                  {data.university.name.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-[12px] font-medium text-phantom-textSecondary">
                  {data.university.name}
                </p>
                <p className="text-[10px] text-phantom-textMuted font-mono">
                  {data.university.domain}
                  {data.university.studentCount
                    ? ` — ${data.university.studentCount.toLocaleString("de-DE")} Studenten`
                    : ""}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
