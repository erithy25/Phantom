"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import type { GpaHistoryEntry } from "@/types";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface GpaOverviewProps {
  currentGpa: number;
  semesterGpa: number;
  gpaTrend: number;
  totalCredits: number;
  history: GpaHistoryEntry[];
}

/* -------------------------------------------------------------------------- */
/*  Custom Tooltip                                                             */
/* -------------------------------------------------------------------------- */

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className={cn(
        "rounded-md border border-phantom-border",
        "bg-phantom-bgCard px-3 py-2",
        "shadow-phantom-lg"
      )}
    >
      <p className="text-caption text-phantom-textTertiary mb-0.5">{label}</p>
      <p className="font-mono text-[14px] font-semibold text-phantom-text">
        {payload[0].value.toFixed(2)}
      </p>
      {payload[0].payload.credits && (
        <p className="text-micro text-phantom-textMuted">
          {payload[0].payload.credits} credits
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Custom Dot                                                                 */
/* -------------------------------------------------------------------------- */

function ActiveDot(props: any) {
  const { cx, cy, index, dataLength } = props;
  const isLast = index === dataLength - 1;

  return (
    <g>
      {isLast && (
        <circle
          cx={cx}
          cy={cy}
          r={8}
          fill="var(--phantom-text)"
          fillOpacity={0.1}
        />
      )}
      <circle
        cx={cx}
        cy={cy}
        r={isLast ? 4 : 3}
        fill={isLast ? "var(--phantom-text)" : "var(--phantom-bg-card)"}
        stroke="var(--phantom-text)"
        strokeWidth={isLast ? 2 : 1.5}
        strokeOpacity={isLast ? 1 : 0.5}
      />
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function GpaOverview({
  currentGpa,
  semesterGpa,
  gpaTrend,
  totalCredits,
  history,
}: GpaOverviewProps) {
  const [hoveredGpa, setHoveredGpa] = useState<number | null>(null);

  const displayGpa = hoveredGpa ?? currentGpa;
  const trendPositive = gpaTrend > 0;
  const trendNeutral = gpaTrend === 0;

  const TrendIcon = trendPositive
    ? TrendingUp
    : trendNeutral
    ? Minus
    : TrendingDown;

  const trendColor = trendPositive
    ? "text-phantom-success"
    : trendNeutral
    ? "text-phantom-textMuted"
    : "text-phantom-danger";

  const trendBg = trendPositive
    ? "bg-phantom-success/10 border-phantom-success/20"
    : trendNeutral
    ? "bg-phantom-bgTertiary/50 border-phantom-border"
    : "bg-phantom-danger/10 border-phantom-danger/20";

  /* Prepare chart data with index for dot rendering */
  const chartData = history.map((entry, i) => ({
    ...entry,
    index: i,
    dataLength: history.length,
  }));

  return (
    <div className="space-y-6">
      {/* ---- Metric Row ---- */}
      <div className="flex items-end justify-between gap-6">
        <div className="flex items-end gap-4">
          {/* Current GPA - Large Display */}
          <motion.div
            key={displayGpa.toFixed(2)}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <span
              className={cn(
                "font-mono text-[48px] font-extrabold leading-none tracking-[-0.03em]",
                "text-phantom-text"
              )}
            >
              {displayGpa.toFixed(2)}
            </span>
          </motion.div>

          {/* Trend Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className={cn(
              "inline-flex items-center gap-1 mb-2",
              "rounded-full px-2.5 py-1 border",
              "font-mono text-[12px] font-medium",
              trendBg,
              trendColor
            )}
          >
            <TrendIcon className="w-3 h-3" />
            <span>
              {trendPositive ? "+" : ""}
              {gpaTrend.toFixed(2)}
            </span>
          </motion.div>
        </div>

        {/* Secondary Stats */}
        <div className="flex gap-6 mb-2">
          <div className="text-right">
            <p className="text-label-mono text-phantom-textMuted uppercase mb-0.5">
              Semester
            </p>
            <p className="font-mono text-[18px] font-semibold text-phantom-text">
              {semesterGpa.toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-label-mono text-phantom-textMuted uppercase mb-0.5">
              Credits
            </p>
            <p className="font-mono text-[18px] font-semibold text-phantom-text">
              {totalCredits}
            </p>
          </div>
        </div>
      </div>

      {/* ---- Trend Chart ---- */}
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
            onMouseMove={(state: any) => {
              if (state?.activePayload?.[0]) {
                setHoveredGpa(state.activePayload[0].value);
              }
            }}
            onMouseLeave={() => setHoveredGpa(null)}
          >
            <defs>
              <linearGradient id="gpaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--phantom-text)"
                  stopOpacity={0.1}
                />
                <stop
                  offset="95%"
                  stopColor="var(--phantom-text)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="semester"
              axisLine={{ stroke: "var(--phantom-border)", strokeWidth: 1 }}
              tickLine={false}
              tick={{
                fill: "var(--phantom-text-tertiary)",
                fontSize: 11,
                fontFamily: "JetBrains Mono, monospace",
              }}
              dy={8}
            />
            <YAxis
              domain={["dataMin - 0.2", "dataMax + 0.2"]}
              axisLine={{ stroke: "var(--phantom-border)", strokeWidth: 1 }}
              tickLine={false}
              tick={{
                fill: "var(--phantom-text-tertiary)",
                fontSize: 11,
                fontFamily: "JetBrains Mono, monospace",
              }}
              tickFormatter={(v: number) => v.toFixed(1)}
              width={45}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{
                stroke: "var(--phantom-border-hover)",
                strokeDasharray: "4 4",
              }}
            />
            <Area
              type="monotone"
              dataKey="gpa"
              stroke="var(--phantom-text)"
              strokeWidth={2}
              fill="url(#gpaGradient)"
              dot={(props: any) => (
                <ActiveDot
                  {...props}
                  dataLength={chartData.length}
                />
              )}
              activeDot={{
                r: 5,
                fill: "var(--phantom-text)",
                stroke: "var(--phantom-bg)",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
