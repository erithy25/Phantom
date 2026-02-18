"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronDown,
  ChevronUp,
  BookOpen,
  FileText,
  Layers,
  HelpCircle,
  Clock,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, formatDuration } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FlashcardDeck } from "@/components/lectures/flashcard-deck";
import type { Lecture, Flashcard, ExamQuestion } from "@/types";

/* -------------------------------------------------------------------------- */
/*  Transcript Line                                                            */
/* -------------------------------------------------------------------------- */

interface TranscriptLine {
  timestamp: number;
  text: string;
}

function parseTranscript(raw: string | null): TranscriptLine[] {
  if (!raw) return [];
  // Expected format: "[00:01:23] Text here\n[00:01:45] More text..."
  // Fallback: treat entire text as one block
  const lines = raw.split("\n").filter(Boolean);
  const parsed: TranscriptLine[] = [];

  for (const line of lines) {
    const match = line.match(/^\[(\d{2}):(\d{2}):(\d{2})\]\s*(.*)$/);
    if (match) {
      const hours = parseInt(match[1], 10);
      const mins = parseInt(match[2], 10);
      const secs = parseInt(match[3], 10);
      parsed.push({
        timestamp: hours * 3600 + mins * 60 + secs,
        text: match[4],
      });
    } else {
      const simpleMatch = line.match(/^\[(\d{1,2}):(\d{2})\]\s*(.*)$/);
      if (simpleMatch) {
        const mins = parseInt(simpleMatch[1], 10);
        const secs = parseInt(simpleMatch[2], 10);
        parsed.push({ timestamp: mins * 60 + secs, text: simpleMatch[3] });
      } else {
        parsed.push({ timestamp: parsed.length * 30, text: line });
      }
    }
  }
  return parsed;
}

function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

/* -------------------------------------------------------------------------- */
/*  Audio Player                                                               */
/* -------------------------------------------------------------------------- */

interface AudioPlayerProps {
  audioUrl: string | null;
  duration: number;
  currentTime: number;
  onSeek: (time: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  playbackRate: number;
  onChangeRate: () => void;
  onSkip: (delta: number) => void;
}

function AudioPlayer({
  duration,
  currentTime,
  onSeek,
  isPlaying,
  onTogglePlay,
  playbackRate,
  onChangeRate,
  onSkip,
}: AudioPlayerProps) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={cn(
        "sticky bottom-0 z-20",
        "border-t border-phantom-border",
        "bg-phantom-bgSecondary/95 backdrop-blur-sm",
        "px-6 py-3"
      )}
    >
      {/* Progress Bar */}
      <div
        className="relative h-1 bg-phantom-accentBg rounded-full mb-3 cursor-pointer group"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = (e.clientX - rect.left) / rect.width;
          onSeek(pct * duration);
        }}
      >
        <div
          className="absolute left-0 top-0 h-full bg-phantom-text/70 rounded-full transition-[width] duration-100"
          style={{ width: `${progress}%` }}
        />
        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 w-3 h-3",
            "bg-phantom-text rounded-full shadow-phantom-sm",
            "opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          )}
          style={{ left: `calc(${progress}% - 6px)` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <span className="text-micro text-phantom-textMuted font-mono w-16">
          {formatTimestamp(Math.floor(currentTime))}
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSkip(-15)}
            className="w-8 h-8 flex items-center justify-center rounded-sm text-phantom-textTertiary hover:text-phantom-text transition-colors"
            aria-label="Skip back 15 seconds"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={onTogglePlay}
            className={cn(
              "w-10 h-10 flex items-center justify-center rounded-full",
              "bg-phantom-text text-phantom-bg",
              "hover:opacity-90 active:scale-95",
              "transition-all duration-150"
            )}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </button>

          <button
            onClick={() => onSkip(15)}
            className="w-8 h-8 flex items-center justify-center rounded-sm text-phantom-textTertiary hover:text-phantom-text transition-colors"
            aria-label="Skip forward 15 seconds"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3 w-16 justify-end">
          <button
            onClick={onChangeRate}
            className={cn(
              "px-2 py-0.5 rounded-sm text-[11px] font-mono font-medium",
              "border border-phantom-border text-phantom-textSecondary",
              "hover:border-phantom-borderHover hover:text-phantom-text",
              "transition-colors duration-150"
            )}
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Exam Questions                                                             */
/* -------------------------------------------------------------------------- */

function ExamQuestionsSection({ questions }: { questions: ExamQuestion[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {questions.map((q, i) => (
        <div
          key={q.id}
          className={cn(
            "rounded-lg border border-phantom-border",
            "bg-phantom-bgCard overflow-hidden"
          )}
        >
          <button
            onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
            className="w-full flex items-start gap-3 p-3 text-left hover:bg-phantom-bgCardHover transition-colors"
          >
            <span className="shrink-0 w-6 h-6 rounded-md bg-phantom-accentBg flex items-center justify-center text-[11px] font-mono text-phantom-textTertiary">
              {i + 1}
            </span>
            <span className="text-body text-phantom-text flex-1">
              {q.question}
            </span>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-phantom-textMuted shrink-0 transition-transform duration-200",
                expandedId === q.id && "rotate-180"
              )}
            />
          </button>
          <AnimatePresence>
            {expandedId === q.id && q.answer && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="px-3 pb-3 pl-12">
                  <p className="text-body text-phantom-textSecondary">
                    {q.answer}
                  </p>
                  {q.topic && (
                    <span className="inline-block mt-2 text-micro text-phantom-textMuted font-mono">
                      Topic: {q.topic}
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function LectureDetailPage() {
  const params = useParams();
  const router = useRouter();
  const lectureId = params?.id as string;

  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  // Audio state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const rates = [1, 1.5, 2];

  // Active tab for content area
  const [activeTab, setActiveTab] = useState<
    "transcript" | "flashcards" | "examQs"
  >("transcript");

  const transcriptLines = parseTranscript(lecture?.transcript ?? null);

  // Fetch lecture
  useEffect(() => {
    async function fetchLecture() {
      try {
        const res = await fetch(`/api/lectures/${lectureId}`);
        if (res.ok) {
          const data = await res.json();
          setLecture(data);
        }
      } catch (err) {
        console.error("Failed to fetch lecture:", err);
      } finally {
        setLoading(false);
      }
    }
    if (lectureId) fetchLecture();
  }, [lectureId]);

  // Audio handlers
  useEffect(() => {
    if (!lecture?.audioUrl) return;
    const audio = new Audio(lecture.audioUrl);
    audioRef.current = audio;

    audio.addEventListener("timeupdate", () => setCurrentTime(audio.currentTime));
    audio.addEventListener("ended", () => setIsPlaying(false));

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", () => {});
      audio.removeEventListener("ended", () => {});
    };
  }, [lecture?.audioUrl]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  const skip = useCallback(
    (delta: number) => {
      if (!audioRef.current) return;
      const newTime = Math.max(
        0,
        Math.min(
          audioRef.current.duration || 0,
          audioRef.current.currentTime + delta
        )
      );
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    },
    []
  );

  const cycleRate = useCallback(() => {
    const idx = rates.indexOf(playbackRate);
    const next = rates[(idx + 1) % rates.length];
    setPlaybackRate(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  }, [playbackRate]);

  // Find active transcript line
  const activeLineIdx = transcriptLines.reduce((acc, line, i) => {
    return line.timestamp <= currentTime ? i : acc;
  }, 0);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-40" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 mt-8">
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
          <div className="space-y-3">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!lecture) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-20 text-center">
        <p className="text-body text-phantom-textSecondary mb-4">
          Lecture not found.
        </p>
        <Button variant="default" size="sm" onClick={() => router.push("/lectures")}>
          <ArrowLeft className="w-4 h-4" />
          Back to Lectures
        </Button>
      </div>
    );
  }

  const duration = lecture.durationSeconds || 0;

  return (
    <div className="flex flex-col h-full">
      {/* Top Section */}
      <div className="max-w-6xl mx-auto w-full px-6 py-6 flex-1 overflow-auto">
        {/* Back + Title */}
        <div className="mb-6">
          <Link
            href="/lectures"
            className="inline-flex items-center gap-1.5 text-caption text-phantom-textTertiary hover:text-phantom-text transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Lectures
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-page-title text-phantom-text mb-1">
                {lecture.title || "Untitled Lecture"}
              </h1>
              <div className="flex items-center gap-3 text-caption text-phantom-textTertiary">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(lecture.date)}
                </span>
                {duration > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(duration)}
                  </span>
                )}
                {lecture.course && (
                  <Badge variant="default">{lecture.course.code}</Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible Summary */}
        {lecture.summary && (
          <motion.div
            className={cn(
              "mb-6 rounded-lg border border-phantom-border",
              "bg-phantom-bgCard overflow-hidden"
            )}
          >
            <button
              onClick={() => setSummaryExpanded(!summaryExpanded)}
              className="w-full flex items-center justify-between p-4 hover:bg-phantom-bgCardHover transition-colors"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-phantom-textTertiary" />
                <span className="text-card-title">Summary</span>
              </div>
              {summaryExpanded ? (
                <ChevronUp className="w-4 h-4 text-phantom-textMuted" />
              ) : (
                <ChevronDown className="w-4 h-4 text-phantom-textMuted" />
              )}
            </button>
            <AnimatePresence>
              {summaryExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="px-4 pb-4 text-body text-phantom-textSecondary leading-relaxed whitespace-pre-wrap">
                    {lecture.summary}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          {/* Left: Tabs + Content */}
          <div>
            {/* Tab Bar */}
            <div className="flex items-center gap-1 border-b border-phantom-border mb-4">
              {[
                { id: "transcript" as const, label: "Transcript", icon: FileText },
                { id: "flashcards" as const, label: "Flashcards", icon: Layers },
                { id: "examQs" as const, label: "Exam Questions", icon: HelpCircle },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 pb-2.5 pt-1",
                    "text-body font-medium border-b-2 -mb-px",
                    "transition-colors duration-200",
                    activeTab === id
                      ? "text-phantom-text border-phantom-text"
                      : "text-phantom-textMuted border-transparent hover:text-phantom-textSecondary"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Transcript */}
            {activeTab === "transcript" && (
              <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-2">
                {transcriptLines.length > 0 ? (
                  transcriptLines.map((line, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.01 }}
                      className={cn(
                        "flex gap-3 p-2 rounded-md cursor-pointer",
                        "transition-colors duration-200",
                        i === activeLineIdx
                          ? "bg-phantom-accentBg"
                          : "hover:bg-phantom-bgCardHover"
                      )}
                      onClick={() => seek(line.timestamp)}
                    >
                      <span className="shrink-0 text-micro font-mono text-phantom-textMuted w-12 text-right pt-0.5">
                        {formatTimestamp(line.timestamp)}
                      </span>
                      <p
                        className={cn(
                          "text-body flex-1",
                          i === activeLineIdx
                            ? "text-phantom-text"
                            : "text-phantom-textSecondary"
                        )}
                      >
                        {line.text}
                      </p>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <FileText className="w-8 h-8 text-phantom-textMuted mx-auto mb-3" />
                    <p className="text-body text-phantom-textSecondary">
                      No transcript available yet.
                    </p>
                    <p className="text-caption text-phantom-textMuted mt-1">
                      The transcript will appear once processing is complete.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Flashcards */}
            {activeTab === "flashcards" && (
              <div>
                {lecture.flashcards && lecture.flashcards.length > 0 ? (
                  <FlashcardDeck flashcards={lecture.flashcards} />
                ) : (
                  <div className="py-12 text-center">
                    <Layers className="w-8 h-8 text-phantom-textMuted mx-auto mb-3" />
                    <p className="text-body text-phantom-textSecondary">
                      No flashcards generated yet.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Exam Questions */}
            {activeTab === "examQs" && (
              <div>
                {lecture.examQuestions && lecture.examQuestions.length > 0 ? (
                  <ExamQuestionsSection questions={lecture.examQuestions} />
                ) : (
                  <div className="py-12 text-center">
                    <HelpCircle className="w-8 h-8 text-phantom-textMuted mx-auto mb-3" />
                    <p className="text-body text-phantom-textSecondary">
                      No exam questions generated yet.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Sidebar - Related Materials */}
          <div className="hidden lg:block space-y-4">
            <div className="rounded-lg border border-phantom-border bg-phantom-bgCard p-4">
              <h3 className="text-card-title text-phantom-text mb-3">
                Lecture Info
              </h3>
              <div className="space-y-3">
                {lecture.course && (
                  <div>
                    <span className="text-label-mono text-phantom-textMuted block mb-1">
                      COURSE
                    </span>
                    <span className="text-body text-phantom-text">
                      {lecture.course.name}
                    </span>
                  </div>
                )}
                {lecture.topics && lecture.topics.length > 0 && (
                  <div>
                    <span className="text-label-mono text-phantom-textMuted block mb-1">
                      TOPICS
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {lecture.topics.map((topic, i) => (
                        <Badge key={i} variant="default" className="text-[10px]">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {lecture.captureMethod && (
                  <div>
                    <span className="text-label-mono text-phantom-textMuted block mb-1">
                      CAPTURE
                    </span>
                    <span className="text-body text-phantom-textSecondary capitalize">
                      {lecture.captureMethod.toLowerCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="rounded-lg border border-phantom-border bg-phantom-bgCard p-4">
              <h3 className="text-card-title text-phantom-text mb-3">
                Study Materials
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-body">
                  <span className="text-phantom-textSecondary flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5" />
                    Flashcards
                  </span>
                  <span className="text-phantom-text font-mono">
                    {lecture.flashcards?.length ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-body">
                  <span className="text-phantom-textSecondary flex items-center gap-2">
                    <HelpCircle className="w-3.5 h-3.5" />
                    Exam Questions
                  </span>
                  <span className="text-phantom-text font-mono">
                    {lecture.examQuestions?.length ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-body">
                  <span className="text-phantom-textSecondary flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" />
                    Transcript
                  </span>
                  <span className="text-phantom-text font-mono">
                    {transcriptLines.length > 0 ? `${transcriptLines.length} lines` : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Related Lectures (placeholder) */}
            <div className="rounded-lg border border-phantom-border bg-phantom-bgCard p-4">
              <h3 className="text-card-title text-phantom-text mb-3">
                Related Materials
              </h3>
              <p className="text-caption text-phantom-textMuted">
                Related lectures and resources from this course will appear here.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Audio Player (pinned bottom) */}
      {lecture.audioUrl && (
        <AudioPlayer
          audioUrl={lecture.audioUrl}
          duration={duration}
          currentTime={currentTime}
          onSeek={seek}
          isPlaying={isPlaying}
          onTogglePlay={togglePlay}
          playbackRate={playbackRate}
          onChangeRate={cycleRate}
          onSkip={skip}
        />
      )}
    </div>
  );
}
