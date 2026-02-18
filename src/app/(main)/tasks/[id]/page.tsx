"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  TrendingUp,
  FileEdit,
  Send,
  Sparkles,
  Calendar,
  Weight,
  User,
  BookOpen,
  Lightbulb,
  ListChecks,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface TaskDetail {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: string;
  priority: string;
  weight: number | null;
  maxScore: number | null;
  grade: number | null;
  estimatedTime: number | null;
  gpaImpact: number | null;
  course: {
    name: string;
    code: string;
    professorName: string | null;
  };
  drafts: Array<{
    id: string;
    content: string;
    predictedGrade: string | null;
    wordCount: number | null;
    version: number;
    status: string;
    createdAt: string;
  }>;
}

interface PhantomAnalysis {
  estimatedTime: string;
  gpaImpact: number | null;
  professorTendencies: string[];
  suggestedOutline: string[];
}

/* -------------------------------------------------------------------------- */
/*  Mock Data                                                                  */
/* -------------------------------------------------------------------------- */

const MOCK_TASK: TaskDetail = {
  id: "t1",
  title: "Reaction Mechanisms Problem Set #7",
  description:
    "Complete problems 1-15 covering SN1 and SN2 reaction mechanisms. Show all electron-pushing arrows, intermediates, and products. For each reaction, identify the mechanism type and justify your reasoning based on substrate structure, nucleophile strength, and solvent effects.\n\nAdditional requirements:\n- Include energy diagrams for problems 5, 8, and 12\n- Compare reaction rates for given substrates in problems 13-15\n- Submit typed or neatly handwritten solutions\n\nRefer to Chapter 7 of Wade's Organic Chemistry, sections 7.4-7.11 for reference material.",
  dueDate: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
  status: "DRAFT_READY",
  priority: "HIGH",
  weight: 5,
  maxScore: 100,
  grade: null,
  estimatedTime: 120,
  gpaImpact: 0.08,
  course: {
    name: "Organic Chemistry",
    code: "CHEM 201",
    professorName: "Dr. Whitfield",
  },
  drafts: [
    {
      id: "d1",
      content:
        "Problem 1: SN2 Mechanism\n\nThe reaction of 1-bromobutane with sodium hydroxide proceeds via an SN2 mechanism. This is determined by the primary substrate structure, strong nucleophile (OH-), and polar aprotic solvent conditions.\n\nStep 1: The hydroxide ion attacks the electrophilic carbon from the backside, simultaneously displacing the bromide leaving group.\n\nRate = k[substrate][nucleophile]\n\nThe stereochemistry results in complete inversion of configuration (Walden inversion).\n\n---\n\nProblem 2: SN1 Mechanism\n\nThe reaction of 2-bromo-2-methylpropane with water proceeds via SN1. The tertiary substrate favors unimolecular dissociation, and water is a weak nucleophile.\n\nStep 1: Ionization - The C-Br bond breaks heterolytically to form a tertiary carbocation.\nStep 2: Nucleophilic attack - Water attacks the planar carbocation.\nStep 3: Deprotonation - Loss of a proton yields the alcohol product.\n\nRate = k[substrate]\n\nThe product is a racemic mixture due to the planar carbocation intermediate.",
      predictedGrade: "A-",
      wordCount: 168,
      version: 1,
      status: "GENERATED",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

const MOCK_ANALYSIS: PhantomAnalysis = {
  estimatedTime: "2h 00m",
  gpaImpact: 0.08,
  professorTendencies: [
    "Emphasizes electron-pushing arrow accuracy",
    "Deducts points for missing intermediates",
    "Rewards discussion of stereochemistry",
    "Prefers detailed energy diagram annotations",
  ],
  suggestedOutline: [
    "Identify mechanism type for each problem (SN1/SN2/E1/E2)",
    "Draw complete arrow-pushing mechanisms",
    "Include all intermediates and transition states",
    "Draw energy diagrams for problems 5, 8, 12",
    "Compare rates using Hammond's postulate for 13-15",
    "Final review: verify stereochemistry assignments",
  ],
};

/* -------------------------------------------------------------------------- */
/*  Loading Skeleton                                                           */
/* -------------------------------------------------------------------------- */

function DetailSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 lg:w-[60%] space-y-4">
        <div className="rounded-lg border border-phantom-border p-5 space-y-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-6 w-3/4" />
          <div className="flex gap-3">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-px w-full" />
          <SkeletonText lines={6} />
        </div>
      </div>
      <div className="lg:w-[40%] space-y-4">
        <div className="rounded-lg border border-phantom-border p-4 space-y-3">
          <Skeleton className="h-4 w-36" />
          <SkeletonText lines={4} />
        </div>
        <div className="rounded-lg border border-phantom-border p-4 space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Status Badge                                                               */
/* -------------------------------------------------------------------------- */

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: "default" | "success" | "warning" | "danger"; label: string }> = {
    DRAFT_READY: { variant: "success", label: "Draft Ready" },
    IN_PROGRESS: { variant: "warning", label: "In Progress" },
    SUBMITTED: { variant: "default", label: "Submitted" },
    GRADED: { variant: "success", label: "Graded" },
    NOT_STARTED: { variant: "default", label: "Not Started" },
  };

  const { variant, label } = config[status] ?? { variant: "default" as const, label: status.replace(/_/g, " ") };

  return <Badge variant={variant}>{label}</Badge>;
}

/* -------------------------------------------------------------------------- */
/*  Page Component                                                             */
/* -------------------------------------------------------------------------- */

export default function TaskDetailPage() {
  const params = useParams();
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [analysis, setAnalysis] = useState<PhantomAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [draftContent, setDraftContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* Fetch task data */
  useEffect(() => {
    async function fetchTask() {
      setLoading(true);
      try {
        const res = await fetch(`/api/tasks/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setTask(data);
          if (data?.drafts?.length > 0) {
            setDraftContent(data.drafts[data.drafts.length - 1].content);
          }
        } else {
          setTask(MOCK_TASK);
          if (MOCK_TASK.drafts.length > 0) {
            setDraftContent(MOCK_TASK.drafts[MOCK_TASK.drafts.length - 1].content);
          }
        }
      } catch {
        setTask(MOCK_TASK);
        if (MOCK_TASK.drafts.length > 0) {
          setDraftContent(MOCK_TASK.drafts[MOCK_TASK.drafts.length - 1].content);
        }
      }
      /* Always set mock analysis (API would override) */
      setAnalysis(MOCK_ANALYSIS);
      setLoading(false);
    }
    fetchTask();
  }, [params.id]);

  /* Generate draft */
  const handleGenerateDraft = useCallback(async () => {
    if (!task) return;
    setGenerating(true);
    try {
      const res = await fetch(`/api/tasks/${params.id}/draft`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.draft) {
          setTask((prev) =>
            prev
              ? { ...prev, drafts: [...prev.drafts, data.draft] }
              : prev
          );
          setDraftContent(data.draft.content);
        }
      }
    } catch {
      /* silently fail */
    } finally {
      setGenerating(false);
    }
  }, [task, params.id]);

  /* Submit to LMS */
  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      await fetch(`/api/tasks/${params.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draftContent }),
      });
      setTask((prev) =>
        prev ? { ...prev, status: "SUBMITTED" } : prev
      );
    } catch {
      /* silently fail */
    } finally {
      setSubmitting(false);
    }
  }, [params.id, draftContent]);

  /* Due date formatting */
  const dueInfo = task?.dueDate
    ? (() => {
        const due = new Date(task.dueDate);
        const now = new Date();
        const diffMs = due.getTime() - now.getTime();
        const isOverdue = diffMs < 0 && task.status !== "SUBMITTED" && task.status !== "GRADED";
        const isDueSoon = !isOverdue && diffMs < 24 * 60 * 60 * 1000;
        return { isOverdue, isDueSoon, formatted: formatDate(task.dueDate) };
      })()
    : null;

  const currentDraft =
    task?.drafts && task.drafts.length > 0
      ? task.drafts[task.drafts.length - 1]
      : null;

  const estimatedMinutes = task?.estimatedTime ?? 0;
  const estHours = Math.floor(estimatedMinutes / 60);
  const estMins = estimatedMinutes % 60;
  const estDisplay =
    estimatedMinutes > 0
      ? estMins > 0
        ? `${estHours}h ${estMins}m`
        : `${estHours}h`
      : null;

  if (loading) {
    return (
      <div className="max-w-[1100px] mx-auto px-6 py-8">
        <Skeleton className="h-3 w-16 mb-6" />
        <DetailSkeleton />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="max-w-[1100px] mx-auto px-6 py-8">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertTriangle className="w-8 h-8 text-phantom-textMuted mb-3" />
          <p className="text-body text-phantom-textSecondary">
            Task not found
          </p>
          <Link
            href="/tasks"
            className="text-caption text-phantom-textTertiary hover:text-phantom-text mt-2 transition-colors"
          >
            Back to tasks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-8">
      {/* ---- Back Link ---- */}
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Link
          href="/tasks"
          className={cn(
            "inline-flex items-center gap-1.5 mb-6",
            "text-caption text-phantom-textTertiary",
            "hover:text-phantom-textSecondary",
            "transition-colors duration-150"
          )}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          All Tasks
        </Link>
      </motion.div>

      {/* ---- Main Layout ---- */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* ======== LEFT PANEL (60%) ======== */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 lg:w-[60%]"
        >
          <div
            className={cn(
              "rounded-lg border border-phantom-border",
              "bg-phantom-bgCard p-5"
            )}
          >
            {/* Course + Status */}
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-label-mono text-phantom-textMuted uppercase">
                {task.course.code} &middot; {task.course.name}
              </span>
              <StatusBadge status={task.status} />
            </div>

            {/* Title */}
            <h1 className="text-page-title text-phantom-text mb-3">
              {task.title}
            </h1>

            {/* Meta Badges */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
              {dueInfo && (
                <div
                  className={cn(
                    "flex items-center gap-1.5",
                    "text-caption",
                    dueInfo.isOverdue
                      ? "text-phantom-danger"
                      : dueInfo.isDueSoon
                      ? "text-phantom-warning"
                      : "text-phantom-textTertiary"
                  )}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {dueInfo.isOverdue ? "Overdue: " : "Due "}
                    {dueInfo.formatted}
                  </span>
                </div>
              )}

              {task.weight != null && (
                <div className="flex items-center gap-1.5 text-caption text-phantom-textTertiary">
                  <Weight className="w-3.5 h-3.5" />
                  <span>Weight: {task.weight}%</span>
                </div>
              )}

              {task.gpaImpact != null && task.gpaImpact > 0 && (
                <div className="flex items-center gap-1.5 text-caption text-phantom-success">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span className="font-mono">
                    +{task.gpaImpact.toFixed(3)} GPA
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="border-t border-phantom-border pt-4">
              <h3 className="text-card-title text-phantom-text mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-phantom-textMuted" />
                Assignment Description
              </h3>
              <div className="text-body text-phantom-textSecondary whitespace-pre-wrap leading-relaxed">
                {task.description ||
                  "No description available. Check your LMS for details."}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ======== RIGHT PANEL (40%) ======== */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="lg:w-[40%] space-y-4"
        >
          {/* ---- Phantom Analysis Card ---- */}
          <div
            className={cn(
              "rounded-lg border border-phantom-border",
              "bg-phantom-bgCard p-4"
            )}
          >
            <div className="flex items-center gap-2 mb-4">
              <div
                className={cn(
                  "w-8 h-8 rounded-sm flex items-center justify-center",
                  "bg-phantom-accentBg"
                )}
              >
                <Sparkles className="w-4 h-4 text-phantom-textSecondary" />
              </div>
              <span className="font-mono text-label-mono text-phantom-textMuted uppercase">
                Phantom Analysis
              </span>
            </div>

            <div className="space-y-3">
              {/* Estimated Time */}
              {estDisplay && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-caption text-phantom-textSecondary">
                    <Clock className="w-3.5 h-3.5 text-phantom-textMuted" />
                    Estimated Time
                  </div>
                  <span className="font-mono text-body font-semibold text-phantom-text tabular-nums">
                    {estDisplay}
                  </span>
                </div>
              )}

              {/* GPA Impact */}
              {analysis?.gpaImpact != null && analysis.gpaImpact > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-caption text-phantom-textSecondary">
                    <TrendingUp className="w-3.5 h-3.5 text-phantom-textMuted" />
                    GPA Impact (if A)
                  </div>
                  <span className="font-mono text-body font-semibold text-phantom-success tabular-nums">
                    +{analysis.gpaImpact.toFixed(3)}
                  </span>
                </div>
              )}

              {/* Professor */}
              {task.course.professorName && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-caption text-phantom-textSecondary">
                    <User className="w-3.5 h-3.5 text-phantom-textMuted" />
                    Professor
                  </div>
                  <span className="text-body text-phantom-text">
                    {task.course.professorName}
                  </span>
                </div>
              )}
            </div>

            {/* Professor Tendencies */}
            {analysis?.professorTendencies &&
              analysis.professorTendencies.length > 0 && (
                <div className="mt-4 pt-3 border-t border-phantom-border/50">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Lightbulb className="w-3.5 h-3.5 text-phantom-textMuted" />
                    <span className="text-label-mono text-phantom-textMuted uppercase">
                      Professor Tendencies
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {analysis.professorTendencies.map((t, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-micro text-phantom-textSecondary"
                      >
                        <span className="w-1 h-1 rounded-full bg-phantom-textMuted mt-1.5 shrink-0" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {/* Suggested Outline */}
            {analysis?.suggestedOutline &&
              analysis.suggestedOutline.length > 0 && (
                <div className="mt-4 pt-3 border-t border-phantom-border/50">
                  <div className="flex items-center gap-1.5 mb-2">
                    <ListChecks className="w-3.5 h-3.5 text-phantom-textMuted" />
                    <span className="text-label-mono text-phantom-textMuted uppercase">
                      Suggested Outline
                    </span>
                  </div>
                  <ol className="space-y-1.5">
                    {analysis.suggestedOutline.map((step, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-micro text-phantom-textSecondary"
                      >
                        <span className="font-mono text-[10px] text-phantom-textMuted mt-0.5 w-4 shrink-0 text-right tabular-nums">
                          {i + 1}.
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
          </div>

          {/* ---- Draft Section ---- */}
          {currentDraft ? (
            <div
              className={cn(
                "rounded-lg border border-phantom-border",
                "bg-phantom-bgCard p-4"
              )}
            >
              {/* Draft Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileEdit className="w-4 h-4 text-phantom-success" />
                  <span className="text-card-title text-phantom-text">
                    Draft v{currentDraft.version}
                  </span>
                </div>
                {currentDraft.predictedGrade && (
                  <Badge variant="success">
                    Est: {currentDraft.predictedGrade}
                  </Badge>
                )}
              </div>

              {/* Word Count */}
              {currentDraft.wordCount && (
                <p className="text-micro text-phantom-textTertiary mb-3">
                  <span className="font-mono tabular-nums">
                    {currentDraft.wordCount}
                  </span>{" "}
                  words &middot; ~
                  <span className="font-mono tabular-nums">
                    {Math.ceil(currentDraft.wordCount / 250)}
                  </span>{" "}
                  min read
                </p>
              )}

              {/* Editable Draft Area */}
              <textarea
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                className={cn(
                  "w-full min-h-[320px] max-h-[500px] resize-y",
                  "rounded-sm border border-phantom-border",
                  "bg-phantom-bg p-3",
                  "text-body text-phantom-textSecondary",
                  "font-sans leading-relaxed",
                  "focus:outline-none focus:border-phantom-borderHover",
                  "transition-colors duration-150",
                  "scrollbar-thin"
                )}
              />

              {/* Actions */}
              <div className="flex gap-2 mt-3">
                <Link
                  href={`/drafts/${currentDraft.id}`}
                  className="flex-1"
                >
                  <Button variant="primary" size="sm" className="w-full">
                    <FileEdit className="w-3.5 h-3.5" />
                    Edit in Editor
                  </Button>
                </Link>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : task.status === "SUBMITTED" ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  {task.status === "SUBMITTED" ? "Submitted" : "Submit to LMS"}
                </Button>
              </div>
            </div>
          ) : (
            /* No Draft - Generate CTA */
            <motion.button
              onClick={handleGenerateDraft}
              disabled={generating}
              whileHover={{ scale: 1.005 }}
              whileTap={{ scale: 0.995 }}
              className={cn(
                "w-full rounded-lg",
                "border border-dashed border-phantom-border",
                "bg-phantom-bgCard p-6",
                "hover:border-phantom-borderHover",
                "transition-all duration-200",
                "flex flex-col items-center gap-2",
                "disabled:opacity-50 disabled:pointer-events-none"
              )}
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-phantom-textMuted" />
                  <span className="text-body text-phantom-textSecondary">
                    Generating draft...
                  </span>
                  <Progress value={45} className="w-32 mt-1" />
                </>
              ) : (
                <>
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      "bg-phantom-accentBg"
                    )}
                  >
                    <Sparkles className="w-5 h-5 text-phantom-textSecondary" />
                  </div>
                  <span className="text-body font-medium text-phantom-text">
                    Generate Draft
                  </span>
                  <span className="text-caption text-phantom-textTertiary text-center max-w-[240px]">
                    Phantom will analyze{" "}
                    {task.course.professorName || "your professor"}&#39;s
                    grading style and generate a tailored draft.
                  </span>
                </>
              )}
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
