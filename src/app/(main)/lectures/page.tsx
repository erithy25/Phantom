"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  BookOpen,
  Layers,
  HelpCircle,
  Clock,
  Calendar,
  Filter,
  Search,
  Mic,
  ChevronDown,
  Trash2,
  X,
  PenLine,
  Zap,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, formatDuration } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { LectureUpload } from "@/components/lectures/lecture-upload";
import type { Lecture, Course } from "@/types";

/* -------------------------------------------------------------------------- */
/*  Badge Config                                                               */
/* -------------------------------------------------------------------------- */

const featureBadges = [
  { key: "transcript", label: "Transcript", icon: FileText },
  { key: "summary", label: "Summary", icon: BookOpen },
  { key: "flashcards", label: "Flashcards", icon: Layers },
  { key: "examQs", label: "Exam Qs", icon: HelpCircle },
] as const;

function hasFeature(lecture: Lecture, key: string): boolean {
  switch (key) {
    case "transcript":
      return !!lecture.transcript;
    case "summary":
      return !!lecture.summary;
    case "flashcards":
      return (lecture.flashcards?.length ?? 0) > 0;
    case "examQs":
      return (lecture.examQuestions?.length ?? 0) > 0;
    default:
      return false;
  }
}

/* -------------------------------------------------------------------------- */
/*  Status Badge                                                               */
/* -------------------------------------------------------------------------- */

function ProcessingStatus({ status }: { status: string }) {
  if (status === "COMPLETED") return null;

  const label =
    status === "PROCESSING"
      ? "Processing..."
      : status === "FAILED"
        ? "Failed"
        : "Queued";

  const variant =
    status === "FAILED" ? "danger" : status === "PROCESSING" ? "warning" : "default";

  return (
    <Badge variant={variant} className="text-[10px]">
      {status === "PROCESSING" && (
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse-dot mr-1" />
      )}
      {label}
    </Badge>
  );
}

/* -------------------------------------------------------------------------- */
/*  Generate from Topic (THE main feature)                                     */
/* -------------------------------------------------------------------------- */

function GenerateFromTopic({ courses, onGenerated }: { courses: Course[]; onGenerated: () => void }) {
  const router = useRouter();
  const [courseId, setCourseId] = useState("");
  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!courseId || !topic.trim()) return;
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/lectures/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, topic: topic.trim(), title: topic.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setTopic("");
        onGenerated();
        if (data.lecture?.id) {
          router.push(`/lectures/${data.lecture.id}`);
        }
      } else {
        const data = await res.json();
        setError(data.error || "Failed to generate. Try again.");
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className={cn(
      "rounded-xl border-2 border-phantom-borderHover bg-phantom-bgCard p-6",
      "relative overflow-hidden"
    )}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-phantom-accentBg rounded-full blur-3xl opacity-50 translate-x-8 -translate-y-8" />
      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-phantom-accentBg border border-phantom-border flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-phantom-text" />
          </div>
          <div>
            <h2 className="text-card-title text-phantom-text">Missed a Lecture?</h2>
            <p className="text-caption text-phantom-textMuted">Enter the topic and get the complete lecture content. No attendance needed.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className={cn(
              "h-11 px-3 rounded-lg text-body sm:w-48",
              "bg-phantom-bgInput border border-phantom-border text-phantom-text",
              "focus:outline-none focus:border-phantom-borderHover"
            )}
          >
            <option value="">Course...</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.code} {c.name}</option>
            ))}
          </select>

          <div className="flex-1 relative">
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && courseId && topic.trim()) handleGenerate(); }}
              placeholder="What was the lecture about? e.g. Thermodynamics: Second Law, Supply and Demand Curves..."
              className={cn(
                "w-full h-11 px-4 pr-12 rounded-lg text-body",
                "bg-phantom-bgInput border border-phantom-border text-phantom-text",
                "placeholder:text-phantom-textMuted",
                "focus:outline-none focus:border-phantom-borderHover"
              )}
              disabled={generating}
            />
            {topic.trim() && courseId && (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-phantom-text text-phantom-bg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {generating && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-phantom-accentBg border border-phantom-border">
              <div className="w-5 h-5 rounded-full border-2 border-phantom-border border-t-phantom-text animate-spin shrink-0" />
              <div>
                <p className="text-body text-phantom-text">Generating your lecture content...</p>
                <p className="text-caption text-phantom-textMuted">Creating summary, flashcards, and exam questions. This takes about 30 seconds.</p>
              </div>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-caption text-phantom-danger">{error}</motion.p>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Paste Notes (secondary option)                                             */
/* -------------------------------------------------------------------------- */

function NotesInput({ courses, onSubmitted }: { courses: Course[]; onSubmitted: () => void }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!courseId || !notes.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/lectures/from-notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ courseId, title: title || undefined, notes }) });
      if (res.ok) {
        const data = await res.json();
        setShowForm(false); setNotes(""); setTitle(""); setCourseId("");
        onSubmitted();
        if (data.lecture?.id) {
          router.push(`/lectures/${data.lecture.id}`);
        }
      }
    } catch { /* */ } finally { setSubmitting(false); }
  };

  if (!showForm) {
    return (
      <Button variant="default" size="sm" onClick={() => setShowForm(true)} className="shrink-0">
        <PenLine className="w-3.5 h-3.5" />
        Paste Notes
      </Button>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
      <div className="rounded-lg border border-phantom-borderHover bg-phantom-bgCard p-4 space-y-3 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-caption text-phantom-textMuted block mb-1">Course *</label>
            <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className={cn("w-full h-9 px-3 rounded-md text-body", "bg-phantom-bgInput border border-phantom-border text-phantom-text", "focus:outline-none")}>
              <option value="">Select course...</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.code} {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-caption text-phantom-textMuted block mb-1">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Lecture 12: Thermodynamics" />
          </div>
        </div>
        <div>
          <label className="text-caption text-phantom-textMuted block mb-1">Lecture Notes / Transcript *</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Paste notes from a classmate, professor slides, or any text..."
            className={cn("w-full min-h-[150px] px-3 py-2 rounded-md text-body", "bg-phantom-bgInput border border-phantom-border text-phantom-text", "placeholder:text-phantom-textMuted resize-y", "focus:outline-none focus:border-phantom-borderHover")} />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="default" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} disabled={!courseId || !notes.trim() || submitting}>
            {submitting ? "Analyzing..." : "Analyze Notes"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Lecture Row                                                                */
/* -------------------------------------------------------------------------- */

function LectureRow({ lecture, index, onDelete }: { lecture: Lecture; index: number; onDelete: (id: string) => void }) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04, duration: 0.3 }}>
      <div className="relative group">
        <Link href={`/lectures/${lecture.id}`}>
          <div className={cn("flex items-center gap-4 p-4 rounded-lg", "border border-phantom-border bg-phantom-bgCard", "hover:border-phantom-borderHover hover:bg-phantom-bgCardHover", "hover:-translate-y-px", "transition-all duration-200 cursor-pointer")}>
            <div className={cn("w-10 h-10 rounded-lg shrink-0", "bg-phantom-accentBg border border-phantom-border", "flex items-center justify-center")}>
              {lecture.captureMethod === "GENERATED" ? (
                <Zap className="w-4 h-4 text-phantom-textTertiary" />
              ) : (
                <Mic className="w-4 h-4 text-phantom-textTertiary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-card-title text-phantom-text truncate">{lecture.title || "Untitled Lecture"}</h3>
                <ProcessingStatus status={lecture.processingStatus} />
                {lecture.captureMethod === "GENERATED" && (
                  <Badge variant="default" className="text-[10px]">AI Generated</Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-caption text-phantom-textTertiary">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(lecture.date)}</span>
                {lecture.durationSeconds && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDuration(lecture.durationSeconds)}</span>}
                {lecture.course && <span className="font-mono text-phantom-textMuted">{lecture.course.code}</span>}
              </div>
            </div>
            <div className="hidden md:flex items-center gap-1.5">
              {featureBadges.map(({ key, label, icon: Icon }) => {
                const available = hasFeature(lecture, key);
                return (<div key={key} className={cn("flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium border transition-colors duration-200", available ? "border-phantom-borderHover bg-phantom-accentBg text-phantom-textSecondary" : "border-transparent bg-transparent text-phantom-textMuted/40")}><Icon className="w-3 h-3" /><span className="hidden lg:inline">{label}</span></div>);
              })}
            </div>
          </div>
        </Link>
        {/* Delete overlay */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {deleteConfirm ? (
            <div className="flex items-center gap-1 bg-phantom-bgCard border border-phantom-border rounded-md p-1">
              <button onClick={(e) => { e.preventDefault(); onDelete(lecture.id); }} className="px-2 py-0.5 rounded text-[10px] bg-phantom-danger/10 text-phantom-danger hover:bg-phantom-danger/20 transition-colors">Delete</button>
              <button onClick={(e) => { e.preventDefault(); setDeleteConfirm(false); }} className="p-0.5 rounded text-phantom-textMuted hover:text-phantom-text transition-colors"><X className="w-3 h-3" /></button>
            </div>
          ) : (
            <button onClick={(e) => { e.preventDefault(); setDeleteConfirm(true); }} className="p-1.5 rounded-md bg-phantom-bgCard border border-phantom-border text-phantom-textMuted hover:text-phantom-danger hover:bg-phantom-danger/10 transition-colors">
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Loading Skeleton                                                           */
/* -------------------------------------------------------------------------- */

function LectureListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 rounded-lg border border-phantom-border"
        >
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <div className="hidden md:flex gap-1.5">
            {[1, 2, 3, 4].map((n) => (
              <Skeleton key={n} className="h-6 w-16 rounded-md" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function LecturesPage() {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [showUpload, setShowUpload] = useState(false);
  const [showCourseFilter, setShowCourseFilter] = useState(false);

  const fetchLectures = useCallback(async () => {
    try {
      setLoading(true);
      const [lectRes, courseRes] = await Promise.allSettled([fetch("/api/lectures"), fetch("/api/courses")]);
      if (lectRes.status === "fulfilled" && lectRes.value.ok) {
        const data = await lectRes.value.json();
        setLectures(data.lectures || []);
      }
      if (courseRes.status === "fulfilled" && courseRes.value.ok) {
        const data = await courseRes.value.json();
        setCourses(data.courses || []);
      }
    } catch (err) {
      console.error("Failed to fetch lectures:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLectures();
  }, [fetchLectures]);

  const filteredLectures = lectures.filter((lecture) => {
    const matchesCourse =
      selectedCourse === "all" || lecture.courseId === selectedCourse;
    const matchesSearch =
      !searchQuery ||
      lecture.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lecture.course?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lecture.course?.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCourse && matchesSearch;
  });

  const selectedCourseName =
    selectedCourse === "all"
      ? "All Courses"
      : courses.find((c) => c.id === selectedCourse)?.code || "Course";

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-page-title text-phantom-text mb-1">
            Lecture Ghost
          </h1>
          <p className="text-body text-phantom-textSecondary">
            Because showing up is optional. Get complete lecture content without attending.
          </p>
        </div>
      </div>

      {/* Main Feature: Generate from Topic */}
      <div className="mb-6">
        <GenerateFromTopic courses={courses} onGenerated={fetchLectures} />
      </div>

      {/* Secondary options bar */}
      <div className="flex items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-phantom-textMuted" />
          <Input
            placeholder="Search lectures..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-body"
          />
        </div>

        {/* Course Filter */}
        <div className="relative">
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowCourseFilter(!showCourseFilter)}
            className="gap-1.5"
          >
            <Filter className="w-3.5 h-3.5" />
            {selectedCourseName}
            <ChevronDown className="w-3 h-3 text-phantom-textMuted" />
          </Button>

          <AnimatePresence>
            {showCourseFilter && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  "absolute right-0 top-full mt-1 z-20",
                  "min-w-[200px] p-1",
                  "rounded-md border border-phantom-border",
                  "bg-phantom-bgCard shadow-phantom-lg"
                )}
              >
                <button
                  onClick={() => {
                    setSelectedCourse("all");
                    setShowCourseFilter(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-xs text-body",
                    "hover:bg-phantom-bgInput transition-colors",
                    selectedCourse === "all"
                      ? "text-phantom-text"
                      : "text-phantom-textSecondary"
                  )}
                >
                  All Courses
                </button>
                {courses.map((course) => (
                  <button
                    key={course.id}
                    onClick={() => {
                      setSelectedCourse(course.id);
                      setShowCourseFilter(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-xs text-body",
                      "hover:bg-phantom-bgInput transition-colors",
                      selectedCourse === course.id
                        ? "text-phantom-text"
                        : "text-phantom-textSecondary"
                    )}
                  >
                    <span className="font-mono text-phantom-textMuted mr-2">
                      {course.code}
                    </span>
                    {course.name}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2">
          <NotesInput courses={courses} onSubmitted={fetchLectures} />
          <Button variant="default" size="sm" onClick={() => setShowUpload(true)} className="shrink-0">
            <Upload className="w-3.5 h-3.5" />
            Upload Audio
          </Button>
        </div>
      </div>

      {/* Lecture Count */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-label-mono text-phantom-textMuted uppercase">
          {loading
            ? "Loading..."
            : `${filteredLectures.length} lecture${filteredLectures.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* Lecture List */}
      {loading ? (
        <LectureListSkeleton />
      ) : filteredLectures.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn(
            "flex flex-col items-center justify-center py-20",
            "rounded-lg border border-dashed border-phantom-border"
          )}
        >
          <div className="w-12 h-12 rounded-full bg-phantom-accentBg flex items-center justify-center mb-4">
            <GraduationCap className="w-5 h-5 text-phantom-textMuted" />
          </div>
          <p className="text-body text-phantom-textSecondary mb-1">
            No lectures yet
          </p>
          <p className="text-caption text-phantom-textMuted mb-4">
            {searchQuery || selectedCourse !== "all"
              ? "Try adjusting your filters"
              : "Enter a topic above to generate your first lecture"}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {filteredLectures.map((lecture, i) => (
            <LectureRow key={lecture.id} lecture={lecture} index={i} onDelete={async (id) => {
              try { const res = await fetch(`/api/lectures/${id}`, { method: "DELETE" }); if (res.ok) setLectures((p) => p.filter((l) => l.id !== id)); } catch { /* */ }
            }} />
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <LectureUpload
        open={showUpload}
        onOpenChange={setShowUpload}
        courses={courses}
        onUploadComplete={fetchLectures}
      />
    </div>
  );
}
