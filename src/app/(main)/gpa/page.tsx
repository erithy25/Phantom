"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, FlaskConical, Target, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GpaOverview } from "@/components/gpa/gpa-overview";
import { CourseBreakdown } from "@/components/gpa/course-breakdown";
import { ScenarioSimulator } from "@/components/gpa/scenario-simulator";
import { GpaAdvisor } from "@/components/gpa/gpa-advisor";
import type { GpaData, GpaHistoryEntry } from "@/types";

/* -------------------------------------------------------------------------- */
/*  Fallback Mock Data                                                         */
/* -------------------------------------------------------------------------- */

const MOCK_GPA_DATA: GpaData = {
  currentGpa: 3.52,
  semesterGpa: 3.64,
  totalCredits: 68,
  courses: [
    {
      id: "1",
      name: "Organic Chemistry",
      code: "CHEM 201",
      credits: 4,
      currentGrade: 81,
      letterGrade: "B-",
      gpaPoints: 2.7,
    },
    {
      id: "2",
      name: "Data Structures",
      code: "CS 201",
      credits: 3,
      currentGrade: 86,
      letterGrade: "B",
      gpaPoints: 3.0,
    },
    {
      id: "3",
      name: "Calculus III",
      code: "MATH 301",
      credits: 4,
      currentGrade: 91,
      letterGrade: "A-",
      gpaPoints: 3.7,
    },
    {
      id: "4",
      name: "Modern Philosophy",
      code: "PHIL 220",
      credits: 3,
      currentGrade: 88,
      letterGrade: "B+",
      gpaPoints: 3.3,
    },
    {
      id: "5",
      name: "Technical Writing",
      code: "ENG 215",
      credits: 3,
      currentGrade: 95,
      letterGrade: "A",
      gpaPoints: 4.0,
    },
  ],
};

const MOCK_HISTORY: GpaHistoryEntry[] = [
  { semester: "Fall 23", gpa: 3.2, credits: 15 },
  { semester: "Spr 24", gpa: 3.35, credits: 16 },
  { semester: "Fall 24", gpa: 3.47, credits: 17 },
  { semester: "Spr 25", gpa: 3.52, credits: 20 },
];

/* -------------------------------------------------------------------------- */
/*  Section Wrapper                                                            */
/* -------------------------------------------------------------------------- */

function Section({
  id,
  icon: Icon,
  title,
  description,
  children,
  delay = 0,
}: {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <Icon className="w-4 h-4 text-phantom-textMuted" />
            <CardTitle>{title}</CardTitle>
          </div>
          <p className="text-caption text-phantom-textTertiary">
            {description}
          </p>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </motion.section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page Loading Skeleton                                                      */
/* -------------------------------------------------------------------------- */

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-lg border border-phantom-border p-5 space-y-4"
        >
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-[120px] w-full" />
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page Component                                                             */
/* -------------------------------------------------------------------------- */

export default function GpaLabPage() {
  const [gpaData, setGpaData] = useState<GpaData | null>(null);
  const [history, setHistory] = useState<GpaHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [gpaRes, historyRes] = await Promise.allSettled([
          fetch("/api/gpa"),
          fetch("/api/gpa/history"),
        ]);

        if (gpaRes.status === "fulfilled" && gpaRes.value.ok) {
          setGpaData(await gpaRes.value.json());
        } else {
          setGpaData(MOCK_GPA_DATA);
        }

        if (historyRes.status === "fulfilled" && historyRes.value.ok) {
          setHistory(await historyRes.value.json());
        } else {
          setHistory(MOCK_HISTORY);
        }
      } catch {
        setGpaData(MOCK_GPA_DATA);
        setHistory(MOCK_HISTORY);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-[1100px] mx-auto px-6 py-8">
        <PageSkeleton />
      </div>
    );
  }

  if (!gpaData) return null;

  const gpaTrend =
    history.length >= 2
      ? history[history.length - 1].gpa - history[history.length - 2].gpa
      : 0;

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-8 space-y-6">
      {/* ---- Page Header ---- */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-page-title text-phantom-text">
          GPA Optimization Lab
        </h1>
        <p className="text-body text-phantom-textSecondary mt-1">
          Analyze, simulate, and optimize your academic performance.
        </p>
      </motion.div>

      {/* ---- GPA Overview ---- */}
      <Section
        id="overview"
        icon={TrendingUp}
        title="GPA Overview"
        description="Your cumulative GPA trend across semesters."
        delay={0.05}
      >
        <GpaOverview
          currentGpa={gpaData.currentGpa}
          semesterGpa={gpaData.semesterGpa}
          gpaTrend={gpaTrend}
          totalCredits={gpaData.totalCredits}
          history={history}
        />
      </Section>

      {/* ---- Course Breakdown ---- */}
      <Section
        id="breakdown"
        icon={FlaskConical}
        title="Course GPA Breakdown"
        description="Drag the what-if sliders to see how grade changes affect your GPA."
        delay={0.1}
      >
        <CourseBreakdown
          courses={gpaData.courses}
          currentGpa={gpaData.currentGpa}
        />
      </Section>

      {/* ---- Scenario Simulator ---- */}
      <Section
        id="simulator"
        icon={Target}
        title="Scenario Simulator"
        description="Create and compare grade scenarios to plan your semester."
        delay={0.15}
      >
        <ScenarioSimulator
          courses={gpaData.courses}
          currentGpa={gpaData.currentGpa}
        />
      </Section>

      {/* ---- GPA Advisor ---- */}
      <Section
        id="advisor"
        icon={Sparkles}
        title="GPA Advisor"
        description="AI-powered study recommendations ranked by GPA impact."
        delay={0.2}
      >
        <GpaAdvisor />
      </Section>
    </div>
  );
}
