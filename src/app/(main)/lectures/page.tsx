"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
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
/*  Lecture Row                                                                */
/* -------------------------------------------------------------------------- */

function LectureRow({ lecture, index }: { lecture: Lecture; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <Link href={`/lectures/${lecture.id}`}>
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
            <Mic className="w-4 h-4 text-phantom-textTertiary" />
          </div>

          {/* Main Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-card-title text-phantom-text truncate">
                {lecture.title || "Untitled Lecture"}
              </h3>
              <ProcessingStatus status={lecture.processingStatus} />
            </div>

            <div className="flex items-center gap-3 text-caption text-phantom-textTertiary">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(lecture.date)}
              </span>
              {lecture.durationSeconds && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(lecture.durationSeconds)}
                </span>
              )}
              {lecture.course && (
                <span className="font-mono text-phantom-textMuted">
                  {lecture.course.code}
                </span>
              )}
            </div>
          </div>

          {/* Feature Badges */}
          <div className="hidden md:flex items-center gap-1.5">
            {featureBadges.map(({ key, label, icon: Icon }) => {
              const available = hasFeature(lecture, key);
              return (
                <div
                  key={key}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium",
                    "border transition-colors duration-200",
                    available
                      ? "border-phantom-borderHover bg-phantom-accentBg text-phantom-textSecondary"
                      : "border-transparent bg-transparent text-phantom-textMuted/40"
                  )}
                >
                  <Icon className="w-3 h-3" />
                  <span className="hidden lg:inline">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Link>
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
      const res = await fetch("/api/lectures");
      if (res.ok) {
        const data = await res.json();
        setLectures(data.lectures || []);
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
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-page-title text-phantom-text mb-1">
            Lecture Ghost
          </h1>
          <p className="text-body text-phantom-textSecondary">
            AI-captured lectures with transcripts, summaries, and study materials.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => setShowUpload(true)}
          className="shrink-0"
        >
          <Upload className="w-4 h-4" />
          Upload
        </Button>
      </div>

      {/* Filters */}
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
            <Mic className="w-5 h-5 text-phantom-textMuted" />
          </div>
          <p className="text-body text-phantom-textSecondary mb-1">
            No lectures found
          </p>
          <p className="text-caption text-phantom-textMuted mb-4">
            {searchQuery || selectedCourse !== "all"
              ? "Try adjusting your filters"
              : "Upload a recording to get started"}
          </p>
          {!searchQuery && selectedCourse === "all" && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowUpload(true)}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Lecture
            </Button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-2">
          {filteredLectures.map((lecture, i) => (
            <LectureRow key={lecture.id} lecture={lecture} index={i} />
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
