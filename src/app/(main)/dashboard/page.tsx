"use client";

import { useEffect, useState } from "react";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { AiInsightBanner } from "@/components/dashboard/ai-insight-banner";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { UpcomingTasks } from "@/components/dashboard/upcoming-tasks";
import { CourseOverview } from "@/components/dashboard/course-overview";
import { CampusPulseBanner } from "@/components/dashboard/campus-pulse-banner";

import type { Task } from "@/components/dashboard/upcoming-tasks";
import type { Course } from "@/components/dashboard/course-overview";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface DashboardStats {
  userName: string | null;
  insight: string;
  gpa: number;
  gpaTrend: string;
  credits: number;
  tasksDue: number;
  draftsReady: number;
  tasks: Task[];
  courses: Course[];
  activeUsers: number;
  universityName: string;
}

/* -------------------------------------------------------------------------- */
/*  Loading skeleton                                                           */
/* -------------------------------------------------------------------------- */

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Welcome skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-64 rounded-md skeleton-shimmer" />
        <div className="h-5 w-96 rounded-md skeleton-shimmer" />
      </div>

      {/* Insight skeleton */}
      <div className="h-24 rounded-lg skeleton-shimmer" />

      {/* Stats skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[120px] rounded-lg skeleton-shimmer" />
        ))}
      </div>

      {/* Two-column skeleton */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-[380px] rounded-lg skeleton-shimmer" />
        <div className="h-[380px] rounded-lg skeleton-shimmer" />
      </div>

      {/* Pulse skeleton */}
      <div className="h-14 rounded-lg skeleton-shimmer" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Dashboard page                                                             */
/* -------------------------------------------------------------------------- */

export default function DashboardPage() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchDashboard() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/dashboard/stats", {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch dashboard data (${res.status})`);
        }

        const json = await res.json();
        setData(json);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error("Dashboard fetch error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard"
        );
        // Set fallback data so the page is still usable
        setData(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboard();

    return () => controller.abort();
  }, []);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1200px] px-6 py-8">
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-8">
      <div className="space-y-6">
        {/* Welcome banner */}
        <WelcomeBanner userName={data?.userName} />

        {/* AI Insight */}
        <AiInsightBanner insight={data?.insight} />

        {/* Stats grid */}
        <StatsGrid
          gpa={data?.gpa}
          gpaTrend={data?.gpaTrend}
          credits={data?.credits}
          tasksDue={data?.tasksDue}
          draftsReady={data?.draftsReady}
        />

        {/* Two-column layout: Tasks + Courses */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <UpcomingTasks tasks={data?.tasks} />
          <CourseOverview courses={data?.courses} />
        </div>

        {/* Campus Pulse */}
        <CampusPulseBanner
          activeUsers={data?.activeUsers}
          universityName={data?.universityName}
        />
      </div>
    </div>
  );
}
