"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Layers,
  CalendarCheck,
  TrendingUp,
  ArrowRight,
  BookOpen,
  Brain,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RichContent } from "@/types";

/* -------------------------------------------------------------------------- */
/*  Sub-components for each rich content type                                  */
/* -------------------------------------------------------------------------- */

/* ---- Draft Preview ---- */
function DraftPreviewCard({ data }: { data: Record<string, unknown> }) {
  const title = (data.title as string) || "Draft Preview";
  const preview = (data.preview as string) || "";
  const wordCount = (data.wordCount as number) || 0;
  const predictedGrade = (data.predictedGrade as string) || null;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-phantom-accentBg">
          <FileText size={14} className="text-phantom-textSecondary" />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-phantom-text">{title}</p>
          <p className="text-[10px] font-mono text-phantom-textMuted">
            DRAFT PREVIEW
          </p>
        </div>
      </div>

      {preview && (
        <p className="text-[12px] leading-[1.6] text-phantom-textSecondary line-clamp-3">
          {preview}
        </p>
      )}

      <div className="flex items-center gap-3">
        {wordCount > 0 && (
          <span className="text-[11px] font-mono text-phantom-textMuted">
            {wordCount.toLocaleString()} words
          </span>
        )}
        {predictedGrade && (
          <span className="text-[11px] font-mono text-phantom-success">
            Predicted: {predictedGrade}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md",
            "text-[11px] font-medium",
            "bg-phantom-text text-phantom-bg",
            "hover:opacity-90 active:scale-[0.98]",
            "transition-all"
          )}
        >
          <BookOpen size={12} />
          View Full Draft
        </button>
        <button
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md",
            "text-[11px] font-medium",
            "border border-phantom-border text-phantom-textSecondary",
            "hover:border-phantom-borderHover hover:text-phantom-text",
            "transition-all"
          )}
        >
          Edit
        </button>
      </div>
    </div>
  );
}

/* ---- Flashcard Deck ---- */
function FlashcardDeckCard({ data }: { data: Record<string, unknown> }) {
  const topic = (data.topic as string) || "Flashcards";
  const cardCount = (data.cardCount as number) || 0;
  const difficulty = (data.difficulty as string) || "Mixed";
  const course = (data.course as string) || "";

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-phantom-accentBg">
          <Layers size={14} className="text-phantom-textSecondary" />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-phantom-text">{topic}</p>
          <p className="text-[10px] font-mono text-phantom-textMuted">
            FLASHCARD DECK
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div>
          <p className="text-[20px] font-bold font-mono text-phantom-text tracking-tight">
            {cardCount}
          </p>
          <p className="text-[10px] text-phantom-textMuted">cards</p>
        </div>
        <div className="h-8 w-px bg-phantom-border" />
        <div>
          <p className="text-[12px] font-medium text-phantom-textSecondary">
            {difficulty}
          </p>
          <p className="text-[10px] text-phantom-textMuted">difficulty</p>
        </div>
        {course && (
          <>
            <div className="h-8 w-px bg-phantom-border" />
            <div>
              <p className="text-[12px] font-medium text-phantom-textSecondary">
                {course}
              </p>
              <p className="text-[10px] text-phantom-textMuted">course</p>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md",
            "text-[11px] font-medium",
            "bg-phantom-text text-phantom-bg",
            "hover:opacity-90 active:scale-[0.98]",
            "transition-all"
          )}
        >
          <Brain size={12} />
          Start Review
        </button>
      </div>
    </div>
  );
}

/* ---- Study Plan ---- */
function StudyPlanCard({ data }: { data: Record<string, unknown> }) {
  const title = (data.title as string) || "Study Plan";
  const sessions = (data.sessions as Array<Record<string, unknown>>) || [];
  const totalHours = (data.totalHours as number) || 0;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-phantom-accentBg">
          <CalendarCheck size={14} className="text-phantom-textSecondary" />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-phantom-text">{title}</p>
          <p className="text-[10px] font-mono text-phantom-textMuted">
            STUDY PLAN
            {totalHours > 0 && ` · ${totalHours}h total`}
          </p>
        </div>
      </div>

      {sessions.length > 0 && (
        <div className="space-y-1.5">
          {sessions.slice(0, 4).map((session, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md",
                "bg-phantom-bgSecondary"
              )}
            >
              <span className="text-[10px] font-mono text-phantom-textMuted w-12 flex-shrink-0">
                {(session.time as string) || `Day ${i + 1}`}
              </span>
              <span className="text-[12px] text-phantom-textSecondary truncate">
                {(session.topic as string) || "Study session"}
              </span>
              {session.duration ? (
                <span className="text-[10px] font-mono text-phantom-textMuted ml-auto flex-shrink-0">
                  {String(session.duration)}
                </span>
              ) : null}
            </div>
          ))}
          {sessions.length > 4 && (
            <p className="text-[10px] text-phantom-textMuted px-2.5">
              +{sessions.length - 4} more sessions
            </p>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md",
            "text-[11px] font-medium",
            "bg-phantom-text text-phantom-bg",
            "hover:opacity-90 active:scale-[0.98]",
            "transition-all"
          )}
        >
          <CalendarCheck size={12} />
          Add to Calendar
        </button>
        <button
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md",
            "text-[11px] font-medium",
            "border border-phantom-border text-phantom-textSecondary",
            "hover:border-phantom-borderHover hover:text-phantom-text",
            "transition-all"
          )}
        >
          Adjust Plan
        </button>
      </div>
    </div>
  );
}

/* ---- Grade Simulation ---- */
function GradeSimulationCard({ data }: { data: Record<string, unknown> }) {
  const currentGpa = (data.currentGpa as number) || 0;
  const projectedGpa = (data.projectedGpa as number) || 0;
  const scenarios = (data.scenarios as Array<Record<string, unknown>>) || [];
  const delta = projectedGpa - currentGpa;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-phantom-accentBg">
          <TrendingUp size={14} className="text-phantom-textSecondary" />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-phantom-text">
            GPA Simulation
          </p>
          <p className="text-[10px] font-mono text-phantom-textMuted">
            GRADE IMPACT ANALYSIS
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div>
          <p className="text-[10px] text-phantom-textMuted mb-0.5">Current</p>
          <p className="text-[20px] font-bold font-mono text-phantom-text tracking-tight">
            {currentGpa.toFixed(2)}
          </p>
        </div>
        <ArrowRight size={16} className="text-phantom-textMuted" />
        <div>
          <p className="text-[10px] text-phantom-textMuted mb-0.5">Projected</p>
          <p
            className={cn(
              "text-[20px] font-bold font-mono tracking-tight",
              delta > 0
                ? "text-phantom-success"
                : delta < 0
                  ? "text-phantom-danger"
                  : "text-phantom-text"
            )}
          >
            {projectedGpa.toFixed(2)}
          </p>
        </div>
        <div className="ml-auto">
          <span
            className={cn(
              "text-[12px] font-mono font-semibold",
              delta > 0
                ? "text-phantom-success"
                : delta < 0
                  ? "text-phantom-danger"
                  : "text-phantom-textMuted"
            )}
          >
            {delta > 0 ? "+" : ""}
            {delta.toFixed(2)}
          </span>
        </div>
      </div>

      {scenarios.length > 0 && (
        <div className="space-y-1">
          {scenarios.slice(0, 3).map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-2.5 py-1 rounded bg-phantom-bgSecondary"
            >
              <span className="text-[11px] text-phantom-textSecondary">
                {(s.label as string) || `Scenario ${i + 1}`}
              </span>
              <span className="text-[11px] font-mono font-semibold text-phantom-text">
                {((s.gpa as number) || 0).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md",
            "text-[11px] font-medium",
            "bg-phantom-text text-phantom-bg",
            "hover:opacity-90 active:scale-[0.98]",
            "transition-all"
          )}
        >
          <BarChart3 size={12} />
          Full Analysis
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  RichContentCard dispatcher                                                 */
/* -------------------------------------------------------------------------- */

interface RichContentCardProps {
  richContent: RichContent;
}

export const RichContentCard = memo(function RichContentCard({
  richContent,
}: RichContentCardProps) {
  const { type, data } = richContent;

  const Content = () => {
    switch (type) {
      case "draft":
        return <DraftPreviewCard data={data} />;
      case "flashcards":
        return <FlashcardDeckCard data={data} />;
      case "study-plan":
        return <StudyPlanCard data={data} />;
      case "grade-simulation":
        return <GradeSimulationCard data={data} />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "rounded-md border border-phantom-border",
        "bg-phantom-bgSecondary",
        "p-3.5"
      )}
    >
      <Content />
    </motion.div>
  );
});
