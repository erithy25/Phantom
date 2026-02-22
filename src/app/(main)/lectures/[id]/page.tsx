"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  Lightbulb,
  GraduationCap,
  CheckCircle2,
  Eye,
  EyeOff,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, formatDuration } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FlashcardDeck } from "@/components/lectures/flashcard-deck";
import type { Flashcard, ExamQuestion } from "@/types";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface LectureData {
  id: string;
  title: string | null;
  date: string;
  audioUrl: string | null;
  transcript: string | null;
  summary: string | null;
  durationSeconds: number | null;
  topics: TopicsData | string[] | null;
  captureMethod: string | null;
  processingStatus: string;
  course: { id: string; name: string; code: string; professorName: string | null } | null;
  flashcards: Flashcard[];
  examQuestions: ExamQuestion[];
  flashcardCount: number;
  examQuestionCount: number;
  createdAt: string;
  updatedAt: string;
}

interface TopicsData {
  topics?: string[];
  keyTakeaways?: string[];
  conceptsExplained?: Array<{ concept: string; explanation: string }>;
}

function parseTopics(raw: LectureData["topics"]): {
  topicList: string[];
  keyTakeaways: string[];
  conceptsExplained: Array<{ concept: string; explanation: string }>;
} {
  if (!raw) return { topicList: [], keyTakeaways: [], conceptsExplained: [] };
  if (Array.isArray(raw)) return { topicList: raw as string[], keyTakeaways: [], conceptsExplained: [] };
  const t = raw as TopicsData;
  return {
    topicList: t.topics || [],
    keyTakeaways: t.keyTakeaways || [],
    conceptsExplained: t.conceptsExplained || [],
  };
}

/* -------------------------------------------------------------------------- */
/*  Transcript helpers                                                         */
/* -------------------------------------------------------------------------- */

interface TranscriptLine { timestamp: number; text: string; }

function parseTranscript(raw: string | null): TranscriptLine[] {
  if (!raw) return [];
  const lines = raw.split("\n").filter(Boolean);
  const parsed: TranscriptLine[] = [];
  for (const line of lines) {
    const match = line.match(/^\[(\d{2}):(\d{2}):(\d{2})\]\s*(.*)$/);
    if (match) {
      parsed.push({ timestamp: parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]), text: match[4] });
    } else {
      const simple = line.match(/^\[(\d{1,2}):(\d{2})\]\s*(.*)$/);
      if (simple) {
        parsed.push({ timestamp: parseInt(simple[1]) * 60 + parseInt(simple[2]), text: simple[3] });
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
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

/* -------------------------------------------------------------------------- */
/*  Summary renderer (handles **bold** sections)                               */
/* -------------------------------------------------------------------------- */

function SummaryContent({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <div className="text-body text-phantom-textSecondary leading-[1.8] whitespace-pre-line">
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <span key={i} className="text-phantom-text font-semibold text-[15px]">{part.slice(2, -2)}</span>;
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Exam Questions                                                             */
/* -------------------------------------------------------------------------- */

function ExamQuestionsSection({ questions }: { questions: ExamQuestion[] }) {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-4">
      {questions.map((q, i) => {
        const isRevealed = revealed[q.id];
        return (
          <motion.div key={q.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.2 }}
            className="rounded-lg border border-phantom-border bg-phantom-bgCard p-5">
            <div className="flex items-start gap-3">
              <span className="text-label-mono text-phantom-textMuted font-mono shrink-0 mt-0.5">Q{i + 1}</span>
              <div className="flex-1">
                {q.topic && <Badge variant="default" className="text-[10px] mb-2">{q.topic}</Badge>}
                <p className="text-body text-phantom-text leading-relaxed mb-3">{q.question}</p>
                {isRevealed ? (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                    <div className="border-t border-phantom-border pt-3">
                      <span className="text-[10px] font-mono text-phantom-textMuted uppercase block mb-2">Answer</span>
                      <p className="text-body text-phantom-textSecondary leading-relaxed whitespace-pre-line">{q.answer}</p>
                    </div>
                  </motion.div>
                ) : (
                  <Button variant="default" size="sm" onClick={() => setRevealed((p) => ({ ...p, [q.id]: true }))}>
                    <Eye className="w-3 h-3" /> Show Answer
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Audio Player                                                               */
/* -------------------------------------------------------------------------- */

function AudioPlayer({ duration, currentTime, onSeek, isPlaying, onTogglePlay, playbackRate, onChangeRate, onSkip }: {
  duration: number; currentTime: number; onSeek: (t: number) => void; isPlaying: boolean; onTogglePlay: () => void; playbackRate: number; onChangeRate: () => void; onSkip: (d: number) => void;
}) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  return (
    <div className={cn("sticky bottom-0 z-20 border-t border-phantom-border bg-phantom-bgSecondary/95 backdrop-blur-sm px-6 py-3")}>
      <div className="relative h-1 bg-phantom-accentBg rounded-full mb-3 cursor-pointer group" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); onSeek(((e.clientX - r.left) / r.width) * duration); }}>
        <div className="absolute left-0 top-0 h-full bg-phantom-text/70 rounded-full transition-[width] duration-100" style={{ width: `${progress}%` }} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-micro text-phantom-textMuted font-mono w-16">{formatTimestamp(Math.floor(currentTime))}</span>
        <div className="flex items-center gap-2">
          <button onClick={() => onSkip(-15)} className="w-8 h-8 flex items-center justify-center rounded-sm text-phantom-textTertiary hover:text-phantom-text transition-colors"><SkipBack className="w-4 h-4" /></button>
          <button onClick={onTogglePlay} className="w-10 h-10 flex items-center justify-center rounded-full bg-phantom-text text-phantom-bg hover:opacity-90 active:scale-95 transition-all duration-150">
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          <button onClick={() => onSkip(15)} className="w-8 h-8 flex items-center justify-center rounded-sm text-phantom-textTertiary hover:text-phantom-text transition-colors"><SkipForward className="w-4 h-4" /></button>
        </div>
        <div className="flex items-center gap-3 w-16 justify-end">
          <button onClick={onChangeRate} className="px-2 py-0.5 rounded-sm text-[11px] font-mono font-medium border border-phantom-border text-phantom-textSecondary hover:border-phantom-borderHover hover:text-phantom-text transition-colors duration-150">{playbackRate}x</button>
        </div>
      </div>
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

  const [lecture, setLecture] = useState<LectureData | null>(null);
  const [loading, setLoading] = useState(true);

  // Audio state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const rates = useMemo(() => [1, 1.5, 2], []);

  useEffect(() => {
    async function fetchLecture() {
      try {
        const res = await fetch(`/api/lectures/${lectureId}`);
        if (res.ok) {
          const data = await res.json();
          setLecture(data.lecture);
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
    const onTime = () => setCurrentTime(audio.currentTime);
    const onEnd = () => setIsPlaying(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);
    return () => { audio.pause(); audio.removeEventListener("timeupdate", onTime); audio.removeEventListener("ended", onEnd); };
  }, [lecture?.audioUrl]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause(); else audioRef.current.play();
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  const skip = useCallback((delta: number) => {
    if (!audioRef.current) return;
    const t = Math.max(0, Math.min(audioRef.current.duration || 0, audioRef.current.currentTime + delta));
    audioRef.current.currentTime = t;
    setCurrentTime(t);
  }, []);

  const cycleRate = useCallback(() => {
    const idx = rates.indexOf(playbackRate);
    const next = rates[(idx + 1) % rates.length];
    setPlaybackRate(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  }, [playbackRate, rates]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <Skeleton className="h-5 w-24" />
        <div className="space-y-3"><Skeleton className="h-8 w-2/3" /><Skeleton className="h-4 w-1/3" /></div>
        <div className="flex gap-2">{[1,2,3,4].map((n) => <Skeleton key={n} className="h-8 w-24 rounded-md" />)}</div>
        <div className="space-y-4"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></div>
      </div>
    );
  }

  if (!lecture) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-20 text-center">
        <p className="text-body text-phantom-textSecondary mb-4">Lecture not found.</p>
        <Button variant="default" size="sm" onClick={() => router.push("/lectures")}><ArrowLeft className="w-4 h-4" /> Back to Lectures</Button>
      </div>
    );
  }

  const { topicList, keyTakeaways, conceptsExplained } = parseTopics(lecture.topics);
  const hasAudio = !!lecture.audioUrl;
  const hasSummary = !!lecture.summary;
  const hasFlashcards = lecture.flashcards.length > 0;
  const hasExamQs = lecture.examQuestions.length > 0;
  const hasConcepts = conceptsExplained.length > 0;
  const hasTakeaways = keyTakeaways.length > 0;
  const hasTranscript = !!lecture.transcript && !lecture.transcript.startsWith("[Generated from topic:");
  const duration = lecture.durationSeconds || 0;
  const transcriptLines = parseTranscript(hasTranscript ? lecture.transcript : null);

  // Determine default tab
  const defaultTab = hasSummary ? "summary" : hasConcepts ? "concepts" : hasFlashcards ? "flashcards" : hasExamQs ? "examqs" : "notes";

  return (
    <div className="flex flex-col h-full">
      <div className="max-w-4xl mx-auto w-full px-6 py-6 flex-1 overflow-auto">
        {/* Back link */}
        <Link href="/lectures" className="inline-flex items-center gap-1 text-caption text-phantom-textTertiary hover:text-phantom-text transition-colors mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Lectures
        </Link>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            {lecture.course && <Badge variant="default" className="text-[11px]">{lecture.course.code}</Badge>}
            {lecture.captureMethod === "GENERATED" && (
              <Badge variant="success" className="text-[11px]"><Zap className="w-3 h-3 mr-1" /> AI Generated</Badge>
            )}
            <span className="text-caption text-phantom-textMuted flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {formatDate(lecture.date)}
            </span>
            {duration > 0 && (
              <span className="text-caption text-phantom-textMuted flex items-center gap-1">
                <Clock className="w-3 h-3" /> {formatDuration(duration)}
              </span>
            )}
          </div>
          <h1 className="text-page-title text-phantom-text mb-2">{lecture.title || "Untitled Lecture"}</h1>
          {lecture.course && (
            <p className="text-body text-phantom-textSecondary">
              {lecture.course.name}{lecture.course.professorName ? ` with ${lecture.course.professorName}` : ""}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 mt-4">
            {hasFlashcards && <div className="flex items-center gap-1.5 text-caption text-phantom-textTertiary"><Layers className="w-3.5 h-3.5" /> {lecture.flashcards.length} Flashcards</div>}
            {hasExamQs && <div className="flex items-center gap-1.5 text-caption text-phantom-textTertiary"><HelpCircle className="w-3.5 h-3.5" /> {lecture.examQuestions.length} Exam Questions</div>}
            {topicList.length > 0 && <div className="flex items-center gap-1.5 text-caption text-phantom-textTertiary"><BookOpen className="w-3.5 h-3.5" /> {topicList.length} Topics</div>}
          </div>
        </motion.div>

        {/* Key Takeaways (always visible if present) */}
        {hasTakeaways && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
            <div className={cn("rounded-xl border-2 border-phantom-borderHover bg-phantom-bgCard p-6 relative overflow-hidden")}>
              <div className="absolute top-0 left-0 w-24 h-24 bg-phantom-accentBg rounded-full blur-3xl opacity-40 -translate-x-6 -translate-y-6" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-phantom-text" />
                  <h2 className="text-card-title text-phantom-text">Key Takeaways</h2>
                </div>
                <div className="space-y-3">
                  {keyTakeaways.map((t, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-phantom-textTertiary shrink-0 mt-0.5" />
                      <p className="text-body text-phantom-textSecondary leading-relaxed">{t}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Topic badges */}
        {topicList.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {topicList.map((t, i) => <Badge key={i} variant="default">{t}</Badge>)}
          </div>
        )}

        {/* Tabbed Content */}
        <Tabs defaultValue={defaultTab}>
          <TabsList>
            {hasSummary && <TabsTrigger value="summary" className="gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Lecture Recap</TabsTrigger>}
            {hasConcepts && <TabsTrigger value="concepts" className="gap-1.5"><GraduationCap className="w-3.5 h-3.5" /> Concepts</TabsTrigger>}
            {hasFlashcards && <TabsTrigger value="flashcards" className="gap-1.5"><Layers className="w-3.5 h-3.5" /> Flashcards ({lecture.flashcards.length})</TabsTrigger>}
            {hasExamQs && <TabsTrigger value="examqs" className="gap-1.5"><HelpCircle className="w-3.5 h-3.5" /> Exam Prep ({lecture.examQuestions.length})</TabsTrigger>}
            {hasTranscript && <TabsTrigger value="notes" className="gap-1.5"><FileText className="w-3.5 h-3.5" /> Original Notes</TabsTrigger>}
          </TabsList>

          {/* Summary */}
          {hasSummary && (
            <TabsContent value="summary">
              <div className="rounded-lg border border-phantom-border bg-phantom-bgCard p-6">
                <SummaryContent text={lecture.summary!} />
              </div>
            </TabsContent>
          )}

          {/* Concepts Explained */}
          {hasConcepts && (
            <TabsContent value="concepts">
              <div className="space-y-4">
                {conceptsExplained.map((ce, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.2 }}
                    className="rounded-lg border border-phantom-border bg-phantom-bgCard p-5">
                    <h3 className="text-card-title text-phantom-text mb-3">{ce.concept}</h3>
                    <p className="text-body text-phantom-textSecondary leading-[1.8] whitespace-pre-line">{ce.explanation}</p>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          )}

          {/* Flashcards */}
          {hasFlashcards && (
            <TabsContent value="flashcards">
              <FlashcardDeck flashcards={lecture.flashcards} />
            </TabsContent>
          )}

          {/* Exam Questions */}
          {hasExamQs && (
            <TabsContent value="examqs">
              <ExamQuestionsSection questions={lecture.examQuestions} />
            </TabsContent>
          )}

          {/* Original Notes / Transcript */}
          {hasTranscript && (
            <TabsContent value="notes">
              <div className="rounded-lg border border-phantom-border bg-phantom-bgCard p-6">
                {hasAudio && transcriptLines.length > 0 ? (
                  <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                    {transcriptLines.map((line, i) => (
                      <div key={i} className={cn("flex gap-3 p-2 rounded-md cursor-pointer transition-colors", "hover:bg-phantom-bgCardHover")} onClick={() => seek(line.timestamp)}>
                        <span className="shrink-0 text-micro font-mono text-phantom-textMuted w-12 text-right pt-0.5">{formatTimestamp(line.timestamp)}</span>
                        <p className="text-body text-phantom-textSecondary flex-1">{line.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-body text-phantom-textSecondary leading-[1.8] whitespace-pre-line">{lecture.transcript}</p>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Audio Player (pinned bottom, only for audio lectures) */}
      {hasAudio && (
        <AudioPlayer
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
