"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileEdit,
  Clock,
  AlignLeft,
  ChevronRight,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface DraftListItem {
  id: string;
  assignmentId: string;
  content: string;
  predictedGrade: string | null;
  version: number;
  status: string;
  wordCount: number | null;
  createdAt: string;
  assignment: {
    title: string;
    course: { name: string; code: string };
  };
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const statusConfig: Record<
  string,
  { label: string; color: string; dotColor: string }
> = {
  GENERATING: {
    label: "Generating",
    color: "text-phantom-warning",
    dotColor: "bg-phantom-warning",
  },
  REVIEW: {
    label: "Ready for Review",
    color: "text-phantom-text",
    dotColor: "bg-phantom-text",
  },
  REVISED: {
    label: "Revised",
    color: "text-phantom-textSecondary",
    dotColor: "bg-phantom-textTertiary",
  },
  SUBMITTED: {
    label: "Submitted",
    color: "text-phantom-success",
    dotColor: "bg-phantom-success",
  },
};

function getStatusConfig(status: string) {
  return (
    statusConfig[status] || {
      label: status,
      color: "text-phantom-textMuted",
      dotColor: "bg-phantom-textMuted",
    }
  );
}

function gradeVariant(
  grade: string | null
): "success" | "warning" | "danger" | "default" {
  if (!grade) return "default";
  if (grade.startsWith("A")) return "success";
  if (grade.startsWith("B")) return "warning";
  if (grade.startsWith("C") || grade.startsWith("D") || grade === "F")
    return "danger";
  return "default";
}

/* -------------------------------------------------------------------------- */
/*  Status Groups                                                              */
/* -------------------------------------------------------------------------- */

const STATUS_ORDER = ["GENERATING", "REVIEW", "REVISED", "SUBMITTED"];

function groupByStatus(
  drafts: DraftListItem[]
): Record<string, DraftListItem[]> {
  const groups: Record<string, DraftListItem[]> = {};
  for (const d of drafts) {
    const key = d.status || "UNKNOWN";
    if (!groups[key]) groups[key] = [];
    groups[key].push(d);
  }
  return groups;
}

/* -------------------------------------------------------------------------- */
/*  Draft Card                                                                 */
/* -------------------------------------------------------------------------- */

function DraftCard({ draft, index }: { draft: DraftListItem; index: number }) {
  const status = getStatusConfig(draft.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <Link href={`/drafts/${draft.id}`}>
        <div
          className={cn(
            "group flex items-center gap-4 p-4 rounded-lg",
            "border border-phantom-border bg-phantom-bgCard",
            "hover:border-phantom-borderHover hover:bg-phantom-bgCardHover",
            "hover:-translate-y-px",
            "transition-all duration-200 cursor-pointer"
          )}
        >
          {/* Icon */}
          <div
            className={cn(
              "w-10 h-10 rounded-lg shrink-0",
              "bg-phantom-accentBg border border-phantom-border",
              "flex items-center justify-center",
              "group-hover:border-phantom-borderHover"
            )}
          >
            <FileEdit className="w-4 h-4 text-phantom-textTertiary" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-card-title text-phantom-text truncate">
                {draft.assignment?.title || "Untitled Draft"}
              </h3>
              {draft.predictedGrade && (
                <Badge
                  variant={gradeVariant(draft.predictedGrade)}
                  className="text-[10px]"
                >
                  Est: {draft.predictedGrade}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3 text-caption text-phantom-textTertiary">
              <span className="font-mono text-phantom-textMuted">
                {draft.assignment?.course?.code}
              </span>
              <span className="flex items-center gap-1">
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    status.dotColor
                  )}
                />
                <span className={status.color}>{status.label}</span>
              </span>
              <span>v{draft.version}</span>
              {draft.wordCount != null && (
                <span className="flex items-center gap-1">
                  <AlignLeft className="w-3 h-3" />
                  {draft.wordCount.toLocaleString()} words
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatRelativeTime(draft.createdAt)}
              </span>
            </div>
          </div>

          {/* Arrow */}
          <ChevronRight className="w-4 h-4 text-phantom-textMuted group-hover:text-phantom-textSecondary transition-colors shrink-0" />
        </div>
      </Link>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Loading Skeleton                                                           */
/* -------------------------------------------------------------------------- */

function DraftListSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2].map((group) => (
        <div key={group} className="space-y-3">
          <Skeleton className="h-4 w-32" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 rounded-lg border border-phantom-border"
            >
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/5" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<DraftListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDrafts() {
      try {
        const res = await fetch("/api/drafts");
        if (res.ok) {
          const data = await res.json();
          setDrafts(data.drafts || []);
        } else {
          // Fallback: try legacy endpoint
          const fallbackRes = await fetch("/api/tasks?filter=Draft Ready");
          if (fallbackRes.ok) {
            const data = await fallbackRes.json();
            const allDrafts: DraftListItem[] = [];
            (data.tasks || []).forEach(
              (t: { drafts?: DraftListItem[] }) => {
                if (t.drafts) allDrafts.push(...t.drafts);
              }
            );
            setDrafts(allDrafts);
          }
        }
      } catch (err) {
        console.error("Failed to fetch drafts:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDrafts();
  }, []);

  const groups = groupByStatus(drafts);

  // Sort groups by STATUS_ORDER
  const orderedStatuses = STATUS_ORDER.filter((s) => groups[s]?.length);
  // Include any additional statuses not in predefined order
  const extraStatuses = Object.keys(groups).filter(
    (s) => !STATUS_ORDER.includes(s) && groups[s]?.length
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-page-title text-phantom-text mb-1">
            Draft Factory
          </h1>
          <p className="text-body text-phantom-textSecondary">
            AI-generated drafts for your assignments. Review, refine, and
            submit.
          </p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <DraftListSkeleton />
      ) : drafts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn(
            "flex flex-col items-center justify-center py-20",
            "rounded-lg border border-dashed border-phantom-border"
          )}
        >
          <div className="w-12 h-12 rounded-full bg-phantom-accentBg flex items-center justify-center mb-4">
            <Inbox className="w-5 h-5 text-phantom-textMuted" />
          </div>
          <p className="text-body text-phantom-textSecondary mb-1">
            No drafts yet
          </p>
          <p className="text-caption text-phantom-textMuted">
            Drafts will appear here when Phantom generates them from your
            assignments.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {[...orderedStatuses, ...extraStatuses].map((status) => {
            const items = groups[status];
            if (!items?.length) return null;
            const config = getStatusConfig(status);

            return (
              <div key={status}>
                {/* Group Header */}
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={cn("w-2 h-2 rounded-full", config.dotColor)}
                  />
                  <h2 className="text-label-mono text-phantom-textMuted uppercase">
                    {config.label}
                  </h2>
                  <span className="text-caption text-phantom-textMuted">
                    ({items.length})
                  </span>
                </div>

                {/* Draft Cards */}
                <div className="space-y-2">
                  {items.map((draft, i) => (
                    <DraftCard key={draft.id} draft={draft} index={i} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
