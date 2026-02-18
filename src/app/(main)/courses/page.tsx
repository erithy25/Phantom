"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  BookOpen,
  X,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CourseCard } from "@/components/courses/course-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SkeletonCard } from "@/components/ui/skeleton";
import type { Course } from "@/types";

/* -------------------------------------------------------------------------- */
/*  Add Course Modal                                                           */
/* -------------------------------------------------------------------------- */

interface AddCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    code: string;
    professorName: string;
    credits: number;
    semester: string;
  }) => Promise<void>;
}

function AddCourseModal({ isOpen, onClose, onSubmit }: AddCourseModalProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [professorName, setProfessorName] = useState("");
  const [credits, setCredits] = useState("3");
  const [semester, setSemester] = useState("Spring 2026");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !code.trim()) {
      setError("Course name and code are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        professorName: professorName.trim(),
        credits: parseInt(credits) || 3,
        semester: semester.trim(),
      });
      /* Reset form */
      setName("");
      setCode("");
      setProfessorName("");
      setCredits("3");
      setSemester("Spring 2026");
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add course."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "w-full max-w-md",
            "bg-phantom-bgCard border border-phantom-border",
            "rounded-lg shadow-phantom-lg",
            "p-6"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[17px] font-semibold text-phantom-text tracking-tight">
              Add Course
            </h3>
            <button
              onClick={onClose}
              className="text-phantom-textMuted hover:text-phantom-text transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-mono font-medium text-phantom-textMuted uppercase tracking-wide mb-1.5">
                Course Code
              </label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="ECON 101"
                className="font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono font-medium text-phantom-textMuted uppercase tracking-wide mb-1.5">
                Course Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Introduction to Microeconomics"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono font-medium text-phantom-textMuted uppercase tracking-wide mb-1.5">
                Professor
              </label>
              <Input
                value={professorName}
                onChange={(e) => setProfessorName(e.target.value)}
                placeholder="Dr. Smith"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono font-medium text-phantom-textMuted uppercase tracking-wide mb-1.5">
                  Credits
                </label>
                <Input
                  type="number"
                  min="1"
                  max="6"
                  value={credits}
                  onChange={(e) => setCredits(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono font-medium text-phantom-textMuted uppercase tracking-wide mb-1.5">
                  Semester
                </label>
                <Input
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  placeholder="Spring 2026"
                />
              </div>
            </div>

            {error && (
              <p className="text-[12px] text-phantom-danger">{error}</p>
            )}

            <div className="flex items-center gap-2 pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Course"
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={onClose}
              >
                Cancel
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* -------------------------------------------------------------------------- */
/*  Courses Page                                                               */
/* -------------------------------------------------------------------------- */

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  /* ---- Fetch courses ---- */
  const fetchCourses = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/courses");
      if (!res.ok) throw new Error("Failed to fetch courses");
      const data = await res.json();
      setCourses(data.courses ?? []);
    } catch {
      /* empty state */
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  /* ---- Add course handler ---- */
  const handleAddCourse = useCallback(
    async (data: {
      name: string;
      code: string;
      professorName: string;
      credits: number;
      semester: string;
    }) => {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add course");
      }

      const { course } = await res.json();
      setCourses((prev) => [course, ...prev]);
    },
    []
  );

  return (
    <div className="px-6 py-8 max-w-[1400px] mx-auto">
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-page-title text-phantom-text">Courses</h1>
          <p className="text-body text-phantom-textSecondary mt-1">
            {courses.length} active course{courses.length !== 1 ? "s" : ""} this
            semester
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={16} />
          Add Course
        </Button>
      </div>

      {/* ---- Course grid ---- */}
      {isLoading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} className="h-[220px]" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        /* ---- Empty state ---- */
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "flex flex-col items-center justify-center",
            "py-20 px-6",
            "rounded-lg border border-dashed border-phantom-border"
          )}
        >
          <div
            className={cn(
              "w-14 h-14 rounded-lg",
              "bg-phantom-bgCard border border-phantom-border",
              "flex items-center justify-center mb-4"
            )}
          >
            <BookOpen size={24} className="text-phantom-textMuted" />
          </div>
          <h3 className="text-[15px] font-semibold text-phantom-text mb-1">
            No courses yet
          </h3>
          <p className="text-body text-phantom-textMuted mb-5 text-center max-w-sm">
            Add your courses to let Phantom track your grades, manage
            assignments, and optimize your academic performance.
          </p>
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={16} />
            Add Your First Course
          </Button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4"
        >
          {courses.map((course, i) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Link href={`/courses/${course.id}`}>
                <CourseCard course={course} />
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ---- Add course modal ---- */}
      <AddCourseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddCourse}
      />
    </div>
  );
}
