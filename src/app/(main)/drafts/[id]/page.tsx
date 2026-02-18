"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Sparkles,
  Send,
  RotateCcw,
  AlignLeft,
  Clock,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Draft, ConfidenceArea, PhantomNote } from "@/types";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface DraftDetail extends Draft {
  assignment: {
    title: string;
    description: string | null;
    course: {
      name: string;
      code: string;
      professorName: string | null;
    };
  };
}

/* -------------------------------------------------------------------------- */
/*  Inline Highlighted Content                                                 */
/* -------------------------------------------------------------------------- */

function HighlightedContent({
  content,
  confidenceAreas,
}: {
  content: string;
  confidenceAreas: ConfidenceArea[] | null;
}) {
  if (!confidenceAreas || confidenceAreas.length === 0) {
    return (
      <div className="text-body text-phantom-textSecondary leading-relaxed whitespace-pre-wrap">
        {content}
      </div>
    );
  }

  // Build segments with highlights
  const segments: Array<{
    text: string;
    highlight: ConfidenceArea | null;
  }> = [];

  let lastEnd = 0;
  const sorted = [...confidenceAreas].sort((a, b) => a.start - b.start);

  for (const area of sorted) {
    // Normal text before the highlight
    if (area.start > lastEnd) {
      segments.push({
        text: content.slice(lastEnd, area.start),
        highlight: null,
      });
    }
    // Highlighted text
    segments.push({
      text: content.slice(area.start, area.end),
      highlight: area,
    });
    lastEnd = area.end;
  }
  // Remaining text
  if (lastEnd < content.length) {
    segments.push({ text: content.slice(lastEnd), highlight: null });
  }

  return (
    <div className="text-body text-phantom-textSecondary leading-relaxed whitespace-pre-wrap">
      {segments.map((seg, i) => {
        if (!seg.highlight) {
          return <span key={i}>{seg.text}</span>;
        }
        return (
          <span
            key={i}
            className="relative group/highlight cursor-help"
          >
            <span
              className={cn(
                "px-0.5 rounded-xs",
                seg.highlight.confidence === "low"
                  ? "bg-yellow-500/15"
                  : seg.highlight.confidence === "medium"
                    ? "bg-phantom-warning/10"
                    : "bg-transparent"
              )}
            >
              {seg.text}
            </span>
            {/* Tooltip */}
            <span
              className={cn(
                "absolute bottom-full left-1/2 -translate-x-1/2 mb-2",
                "px-3 py-2 rounded-md",
                "bg-phantom-bgSecondary border border-phantom-border",
                "shadow-phantom-lg",
                "text-caption text-phantom-textSecondary",
                "whitespace-nowrap",
                "opacity-0 pointer-events-none",
                "group-hover/highlight:opacity-100 group-hover/highlight:pointer-events-auto",
                "transition-opacity duration-200 z-10"
              )}
            >
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 text-phantom-warning" />
                {seg.highlight.note}
              </span>
            </span>
          </span>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Grade Badge                                                                */
/* -------------------------------------------------------------------------- */

function GradeBadge({ grade }: { grade: string }) {
  const variant = grade.startsWith("A")
    ? "success"
    : grade.startsWith("B")
      ? "warning"
      : "danger";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md",
        "font-mono text-[14px] font-bold",
        variant === "success" &&
          "bg-phantom-success/10 text-phantom-success border border-phantom-success/20",
        variant === "warning" &&
          "bg-phantom-warning/10 text-phantom-warning border border-phantom-warning/20",
        variant === "danger" &&
          "bg-phantom-danger/10 text-phantom-danger border border-phantom-danger/20"
      )}
    >
      <TrendingUp className="w-3.5 h-3.5" />
      Estimated: {grade}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function DraftDetailPage() {
  const params = useParams();
  const router = useRouter();
  const draftId = params?.id as string;

  const [draft, setDraft] = useState<DraftDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [isImproving, setIsImproving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(true);

  // Fetch draft
  useEffect(() => {
    async function fetchDraft() {
      try {
        // Try the direct draft endpoint first
        const res = await fetch(`/api/drafts/${draftId}`);
        if (res.ok) {
          const data = await res.json();
          const d = data.draft || data;
          setDraft(d);
          setContent(d.content || "");
        } else {
          // Fallback to legacy endpoint
          const fallbackRes = await fetch(`/api/tasks/${draftId}/draft`);
          if (fallbackRes.ok) {
            const data = await fallbackRes.json();
            if (data.draft) {
              setDraft(data.draft);
              setContent(data.draft.content || "");
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch draft:", err);
      } finally {
        setLoading(false);
      }
    }
    if (draftId) fetchDraft();
  }, [draftId]);

  // Compute stats
  const wordCount = useMemo(() => {
    return content.trim().split(/\s+/).filter(Boolean).length;
  }, [content]);

  const readingTime = useMemo(() => {
    return Math.max(1, Math.ceil(wordCount / 250));
  }, [wordCount]);

  // Improve handler
  const handleImprove = async () => {
    setIsImproving(true);
    try {
      const res = await fetch(`/api/drafts/${draftId}/improve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.content) setContent(data.content);
        if (data.draft) {
          setDraft(data.draft);
          setContent(data.draft.content);
        }
      }
    } catch (err) {
      console.error("Improve failed:", err);
    } finally {
      setIsImproving(false);
    }
  };

  // Submit to LMS handler
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await fetch(`/api/drafts/${draftId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      // Refresh draft status
      const res = await fetch(`/api/drafts/${draftId}`);
      if (res.ok) {
        const data = await res.json();
        setDraft(data.draft || data);
      }
    } catch (err) {
      console.error("Submit failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <Skeleton className="h-4 w-24 mb-6" />
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-4">
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-[400px] w-full rounded-lg" />
          </div>
          <div className="lg:w-72 space-y-4">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-20 text-center">
        <p className="text-body text-phantom-textSecondary mb-4">
          Draft not found.
        </p>
        <Button
          variant="default"
          size="sm"
          onClick={() => router.push("/drafts")}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Drafts
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Back */}
      <Link
        href="/drafts"
        className="inline-flex items-center gap-1.5 text-caption text-phantom-textTertiary hover:text-phantom-text transition-colors mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Drafts
      </Link>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Editor Area */}
        <div className="flex-1 min-w-0">
          <div
            className={cn(
              "rounded-lg border border-phantom-border",
              "bg-phantom-bgCard overflow-hidden"
            )}
          >
            {/* Header */}
            <div className="p-5 border-b border-phantom-border">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <span className="text-label-mono text-phantom-textMuted block mb-1">
                    {draft.assignment?.course?.code}
                  </span>
                  <h1 className="text-section-heading text-phantom-text truncate">
                    {draft.assignment?.title || "Untitled Draft"}
                  </h1>
                </div>
                {draft.predictedGrade && (
                  <GradeBadge grade={draft.predictedGrade} />
                )}
              </div>

              <div className="flex items-center gap-4 mt-3 text-caption text-phantom-textTertiary">
                <span className="flex items-center gap-1">
                  <AlignLeft className="w-3 h-3" />
                  {wordCount.toLocaleString()} words
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  ~{readingTime} min read
                </span>
                <span>v{draft.version}</span>
                <span>{formatDate(draft.createdAt)}</span>
              </div>
            </div>

            {/* Editor Content */}
            <div className="p-5">
              <HighlightedContent
                content={content}
                confidenceAreas={draft.confidenceAreas}
              />

              {/* Editable textarea below the highlights for editing */}
              <div className="mt-4 pt-4 border-t border-phantom-border/50">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className={cn(
                    "w-full min-h-[300px]",
                    "bg-transparent text-body text-phantom-textSecondary",
                    "leading-relaxed resize-none",
                    "focus:outline-none"
                  )}
                  placeholder="Edit your draft here..."
                />
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-2 p-5 pt-0 border-t border-phantom-border/50 mt-0 pt-4">
              <Button
                variant="primary"
                size="md"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block w-3 h-3 border-2 border-phantom-bg/30 border-t-phantom-bg rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit to LMS
                  </>
                )}
              </Button>
              <Button
                variant="default"
                size="md"
                onClick={handleImprove}
                disabled={isImproving}
              >
                {isImproving ? (
                  <>
                    <span className="inline-block w-3 h-3 border-2 border-phantom-text/30 border-t-phantom-text rounded-full animate-spin" />
                    Improving...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    Improve
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:w-[280px] shrink-0 space-y-4">
          {/* Phantom Notes */}
          <div
            className={cn(
              "rounded-lg border border-phantom-border",
              "bg-phantom-bgCard overflow-hidden"
            )}
          >
            <button
              onClick={() => setNotesExpanded(!notesExpanded)}
              className="w-full flex items-center justify-between p-4 hover:bg-phantom-bgCardHover transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-phantom-textTertiary" />
                <span className="text-card-title">Phantom Notes</span>
              </div>
              {notesExpanded ? (
                <ChevronUp className="w-4 h-4 text-phantom-textMuted" />
              ) : (
                <ChevronDown className="w-4 h-4 text-phantom-textMuted" />
              )}
            </button>

            <AnimatePresence>
              {notesExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="px-4 pb-4">
                    {draft.phantomNotes && draft.phantomNotes.length > 0 ? (
                      <div className="space-y-3">
                        {draft.phantomNotes.map((note, i) => (
                          <div
                            key={i}
                            className="text-caption"
                          >
                            <p className="text-phantom-text font-medium mb-0.5">
                              {note.section}
                            </p>
                            <p className="text-phantom-textSecondary">
                              {note.note}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-caption text-phantom-textTertiary">
                        {draft.assignment?.course?.professorName
                          ? `Matched ${draft.assignment.course.professorName}'s preferred style and format.`
                          : "Draft generated based on assignment requirements."}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Stats */}
          <div
            className={cn(
              "rounded-lg border border-phantom-border",
              "bg-phantom-bgCard p-4"
            )}
          >
            <h3 className="text-card-title text-phantom-text mb-3">
              Draft Stats
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-body">
                <span className="text-phantom-textSecondary">Word Count</span>
                <span className="text-phantom-text font-mono">
                  {wordCount.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-body">
                <span className="text-phantom-textSecondary">Reading Time</span>
                <span className="text-phantom-text font-mono">
                  ~{readingTime} min
                </span>
              </div>
              <div className="flex items-center justify-between text-body">
                <span className="text-phantom-textSecondary">Version</span>
                <span className="text-phantom-text font-mono">
                  {draft.version}
                </span>
              </div>
              {draft.predictedGrade && (
                <div className="flex items-center justify-between text-body">
                  <span className="text-phantom-textSecondary">Predicted Grade</span>
                  <span
                    className={cn(
                      "font-mono font-bold",
                      draft.predictedGrade.startsWith("A")
                        ? "text-phantom-success"
                        : draft.predictedGrade.startsWith("B")
                          ? "text-phantom-warning"
                          : "text-phantom-text"
                    )}
                  >
                    {draft.predictedGrade}
                  </span>
                </div>
              )}
              {draft.confidenceAreas && draft.confidenceAreas.length > 0 && (
                <div className="flex items-center justify-between text-body">
                  <span className="text-phantom-textSecondary">
                    Low-Confidence Areas
                  </span>
                  <span className="text-phantom-warning font-mono">
                    {draft.confidenceAreas.filter(
                      (a) => a.confidence === "low"
                    ).length}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Assignment Info */}
          {draft.assignment?.description && (
            <div
              className={cn(
                "rounded-lg border border-phantom-border",
                "bg-phantom-bgCard p-4"
              )}
            >
              <h3 className="text-card-title text-phantom-text mb-2">
                Assignment Brief
              </h3>
              <p className="text-caption text-phantom-textTertiary leading-relaxed">
                {draft.assignment.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
