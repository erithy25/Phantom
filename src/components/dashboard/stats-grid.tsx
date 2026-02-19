"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { TrendingUp, BookOpen, Clock, FileEdit } from "lucide-react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface StatCard {
  label: string;
  value: number;
  /** Number of decimal places to display (default 0) */
  decimals?: number;
  trend?: {
    value: string;
    direction: "up" | "down" | "neutral";
  };
  icon: React.ElementType;
}

interface StatsGridProps {
  gpa?: number;
  gpaTrend?: string;
  credits?: number;
  tasksDue?: number;
  draftsReady?: number;
}

/* -------------------------------------------------------------------------- */
/*  Animated counter hook                                                      */
/* -------------------------------------------------------------------------- */

function useAnimatedCounter(target: number, duration = 1200, decimals = 0) {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const easeOut = useCallback((t: number) => 1 - Math.pow(1 - t, 3), []);

  useEffect(() => {
    if (target === 0) {
      setValue(0);
      return;
    }

    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOut(progress);

      const factor = Math.pow(10, decimals);
      setValue(Math.round(easedProgress * target * factor) / factor);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setValue(target);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration, decimals, easeOut]);

  return value;
}

/* -------------------------------------------------------------------------- */
/*  Single stat card                                                           */
/* -------------------------------------------------------------------------- */

function StatCardItem({
  card,
  index,
}: {
  card: StatCard;
  index: number;
}) {
  const animatedValue = useAnimatedCounter(
    card.value,
    1200,
    card.decimals ?? 0
  );

  const Icon = card.icon;

  const trendColor =
    card.trend?.direction === "up"
      ? "text-phantom-success"
      : card.trend?.direction === "down"
        ? "text-phantom-danger"
        : "text-phantom-textMuted";

  const trendBgColor =
    card.trend?.direction === "up"
      ? "bg-phantom-success/10"
      : card.trend?.direction === "down"
        ? "bg-phantom-danger/10"
        : "bg-phantom-accentBg";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 + index * 0.08 }}
    >
      <div
        className={cn(
          "group rounded-lg border border-phantom-border bg-phantom-bgCard p-5",
          "transition-all duration-200 ease-out",
          "hover:border-phantom-borderHover hover:-translate-y-px"
        )}
      >
        <div className="flex items-start justify-between">
          {/* Icon */}
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md",
              "bg-phantom-accentBg"
            )}
          >
            <Icon className="h-4 w-4 text-phantom-textSecondary" />
          </div>

          {/* Trend badge */}
          {card.trend && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5",
                "font-mono text-[11px] font-medium leading-tight",
                trendBgColor,
                trendColor
              )}
            >
              {card.trend.value}
            </span>
          )}
        </div>

        {/* Value */}
        <div className="mt-4">
          <span className="text-large-metric tabular-nums text-phantom-text">
            {card.decimals
              ? animatedValue.toFixed(card.decimals)
              : Math.round(animatedValue)}
          </span>
        </div>

        {/* Label */}
        <span className="mt-1 block text-[12px] text-phantom-textTertiary">
          {card.label}
        </span>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Stats grid                                                                 */
/* -------------------------------------------------------------------------- */

export function StatsGrid({
  gpa = 0,
  gpaTrend,
  credits = 0,
  tasksDue = 0,
  draftsReady = 0,
}: StatsGridProps) {
  const cards: StatCard[] = [
    {
      label: "Current GPA",
      value: gpa,
      decimals: 2,
      trend: gpaTrend ? { value: gpaTrend, direction: gpaTrend.startsWith("-") ? "down" as const : "up" as const } : undefined,
      icon: TrendingUp,
    },
    {
      label: "Semester Credits",
      value: credits,
      icon: BookOpen,
    },
    {
      label: "Tasks Due This Week",
      value: tasksDue,
      trend: tasksDue > 3 ? { value: `${tasksDue}`, direction: "neutral" } : undefined,
      icon: Clock,
    },
    {
      label: "Drafts Ready",
      value: draftsReady,
      trend: draftsReady > 0 ? { value: `${draftsReady} ready`, direction: "up" } : undefined,
      icon: FileEdit,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, i) => (
        <StatCardItem key={card.label} card={card} index={i} />
      ))}
    </div>
  );
}
