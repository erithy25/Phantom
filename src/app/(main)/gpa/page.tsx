"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  FlaskConical,
  Target,
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  X,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { GpaOverview } from "@/components/gpa/gpa-overview";
import { CourseBreakdown } from "@/components/gpa/course-breakdown";
import { ScenarioSimulator } from "@/components/gpa/scenario-simulator";
import { GpaAdvisor } from "@/components/gpa/gpa-advisor";
import type { GpaData, GpaHistoryEntry } from "@/types";

/* -------------------------------------------------------------------------- */
/*  Empty State                                                                */
/* -------------------------------------------------------------------------- */

const EMPTY_GPA_DATA: GpaData = {
  currentGpa: 0,
  semesterGpa: 0,
  totalCredits: 0,
  courses: [],
};

/* -------------------------------------------------------------------------- */
/*  Course Form                                                                */
/* -------------------------------------------------------------------------- */

interface CourseFormData {
  name: string;
  code: string;
  professorName: string;
  credits: number;
  currentGrade: number | null;
  semester: string;
}

const EMPTY_FORM: CourseFormData = {
  name: "",
  code: "",
  professorName: "",
  credits: 3,
  currentGrade: null,
  semester: "",
};

function CourseForm({
  initial,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel,
}: {
  initial: CourseFormData;
  onSubmit: (data: CourseFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel: string;
}) {
  const [form, setForm] = useState<CourseFormData>(initial);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-caption text-phantom-textMuted block mb-1">Course Name *</label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Organic Chemistry" />
        </div>
        <div>
          <label className="text-caption text-phantom-textMuted block mb-1">Course Code *</label>
          <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="CHEM 201" />
        </div>
        <div>
          <label className="text-caption text-phantom-textMuted block mb-1">Professor</label>
          <Input value={form.professorName} onChange={(e) => setForm({ ...form, professorName: e.target.value })} placeholder="Prof. Smith" />
        </div>
        <div>
          <label className="text-caption text-phantom-textMuted block mb-1">Credits</label>
          <Input type="number" min={0} max={12} value={form.credits} onChange={(e) => setForm({ ...form, credits: Number(e.target.value) })} />
        </div>
        <div>
          <label className="text-caption text-phantom-textMuted block mb-1">Current Grade (%)</label>
          <Input type="number" min={0} max={100} value={form.currentGrade ?? ""} onChange={(e) => setForm({ ...form, currentGrade: e.target.value ? Number(e.target.value) : null })} placeholder="e.g. 88" />
        </div>
        <div>
          <label className="text-caption text-phantom-textMuted block mb-1">Semester</label>
          <Input value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} placeholder="Spring 2026" />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="default" size="sm" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" size="sm" onClick={() => onSubmit(form)} disabled={!form.name.trim() || !form.code.trim() || isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Course Management                                                          */
/* -------------------------------------------------------------------------- */

interface CourseItem {
  id: string;
  name: string;
  code: string;
  professorName: string | null;
  credits: number;
  currentGrade: number | null;
  letterGrade: string | null;
  semester?: string | null;
}

function CourseManagement({ onCoursesChanged }: { onCoursesChanged: () => void }) {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    try {
      const res = await fetch("/api/courses");
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
      }
    } catch { /* silently fail */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const handleAdd = async (form: CourseFormData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowAddForm(false);
        await fetchCourses();
        onCoursesChanged();
      }
    } catch { /* */ } finally { setIsSubmitting(false); }
  };

  const handleEdit = async (form: CourseFormData) => {
    if (!editingId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/courses/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setEditingId(null);
        await fetchCourses();
        onCoursesChanged();
      }
    } catch { /* */ } finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/courses/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCourses((prev) => prev.filter((c) => c.id !== id));
        setDeleteConfirm(null);
        onCoursesChanged();
      }
    } catch { /* */ }
  };

  if (loading) return <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>;

  return (
    <div className="space-y-4">
      {courses.length === 0 && !showAddForm ? (
        <div className="text-center py-8">
          <BookOpen className="w-8 h-8 text-phantom-textMuted mx-auto mb-2" />
          <p className="text-body text-phantom-textSecondary mb-1">No courses added yet</p>
          <p className="text-caption text-phantom-textMuted mb-4">Add your courses to start tracking your GPA</p>
        </div>
      ) : (
        <div className="space-y-2">
          {courses.map((course) => (
            <div key={course.id}>
              {editingId === course.id ? (
                <div className="rounded-lg border border-phantom-borderHover bg-phantom-bgCard p-4">
                  <CourseForm
                    initial={{ name: course.name, code: course.code, professorName: course.professorName || "", credits: course.credits, currentGrade: course.currentGrade, semester: course.semester || "" }}
                    onSubmit={handleEdit}
                    onCancel={() => setEditingId(null)}
                    isSubmitting={isSubmitting}
                    submitLabel="Save Changes"
                  />
                </div>
              ) : (
                <div className={cn("flex items-center justify-between p-3 rounded-lg", "border border-phantom-border bg-phantom-bgCard", "hover:border-phantom-borderHover transition-colors")}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-caption text-phantom-textMuted">{course.code}</span>
                      <span className="text-body text-phantom-text font-medium truncate">{course.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-caption text-phantom-textTertiary mt-0.5">
                      {course.professorName && <span>{course.professorName}</span>}
                      <span>{course.credits} credits</span>
                      {course.currentGrade != null && (
                        <span className="font-mono">{course.currentGrade}% {course.letterGrade && `(${course.letterGrade})`}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button onClick={() => setEditingId(course.id)} className="p-1.5 rounded-md text-phantom-textMuted hover:text-phantom-text hover:bg-phantom-bgInput transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {deleteConfirm === course.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleDelete(course.id)} className="px-2 py-1 rounded-md text-[11px] bg-phantom-danger/10 text-phantom-danger hover:bg-phantom-danger/20 transition-colors">Delete</button>
                        <button onClick={() => setDeleteConfirm(null)} className="p-1 rounded-md text-phantom-textMuted hover:text-phantom-text transition-colors"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(course.id)} className="p-1.5 rounded-md text-phantom-textMuted hover:text-phantom-danger hover:bg-phantom-danger/10 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="rounded-lg border border-phantom-borderHover bg-phantom-bgCard p-4">
              <CourseForm initial={EMPTY_FORM} onSubmit={handleAdd} onCancel={() => setShowAddForm(false)} isSubmitting={isSubmitting} submitLabel="Add Course" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showAddForm && (
        <Button variant="default" size="sm" onClick={() => setShowAddForm(true)} className="w-full">
          <Plus className="w-3.5 h-3.5" />
          Add Course
        </Button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section Wrapper                                                            */
/* -------------------------------------------------------------------------- */

function Section({ id, icon: Icon, title, description, children, delay = 0 }: {
  id: string; icon: React.ComponentType<{ className?: string }>; title: string; description: string; children: React.ReactNode; delay?: number;
}) {
  return (
    <motion.section id={id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.35 }}>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <Icon className="w-4 h-4 text-phantom-textMuted" />
            <CardTitle>{title}</CardTitle>
          </div>
          <p className="text-caption text-phantom-textTertiary">{description}</p>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </motion.section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page Skeleton                                                              */
/* -------------------------------------------------------------------------- */

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2"><Skeleton className="h-7 w-40" /><Skeleton className="h-4 w-64" /></div>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-lg border border-phantom-border p-5 space-y-4"><Skeleton className="h-4 w-32" /><Skeleton className="h-[120px] w-full" /></div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function GpaLabPage() {
  const [gpaData, setGpaData] = useState<GpaData | null>(null);
  const [history, setHistory] = useState<GpaHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [gpaRes, historyRes] = await Promise.allSettled([fetch("/api/gpa"), fetch("/api/gpa/history")]);

      if (gpaRes.status === "fulfilled" && gpaRes.value.ok) {
        const raw = await gpaRes.value.json();
        setGpaData({
          currentGpa: raw.gpa ?? 0, semesterGpa: raw.gpa ?? 0, totalCredits: raw.totalCredits ?? 0,
          courses: (raw.courses ?? []).map((c: { id: string; name: string; code: string; credits: number; currentGrade: number | null; letterGrade: string | null; gradePoints?: number }) => ({
            id: c.id, name: c.name, code: c.code, credits: c.credits, currentGrade: c.currentGrade, letterGrade: c.letterGrade, gpaPoints: c.gradePoints ?? 0,
          })),
        });
      } else { setGpaData(EMPTY_GPA_DATA); }

      if (historyRes.status === "fulfilled" && historyRes.value.ok) {
        const raw = await historyRes.value.json();
        const entries = Array.isArray(raw) ? raw : raw.history ?? [];
        setHistory(entries.map((e: { semester: string; semesterGpa?: number; gpa?: number; credits: number }) => ({
          semester: e.semester, gpa: e.semesterGpa ?? e.gpa ?? 0, credits: e.credits,
        })));
      } else { setHistory([]); }
    } catch { setGpaData(EMPTY_GPA_DATA); setHistory([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData, refreshKey]);

  if (loading) return <div className="max-w-[1100px] mx-auto px-6 py-8"><PageSkeleton /></div>;
  if (!gpaData) return null;

  const gpaTrend = history.length >= 2 ? history[history.length - 1].gpa - history[history.length - 2].gpa : 0;

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-page-title text-phantom-text">GPA Optimization Lab</h1>
        <p className="text-body text-phantom-textSecondary mt-1">Analyze, simulate, and optimize your academic performance.</p>
      </motion.div>

      <Section id="courses" icon={BookOpen} title="Your Courses" description="Add, edit, or remove your courses. Set grades to track your GPA." delay={0.02}>
        <CourseManagement onCoursesChanged={() => setRefreshKey((k) => k + 1)} />
      </Section>

      <Section id="overview" icon={TrendingUp} title="GPA Overview" description="Your cumulative GPA trend across semesters." delay={0.05}>
        <GpaOverview currentGpa={gpaData.currentGpa} semesterGpa={gpaData.semesterGpa} gpaTrend={gpaTrend} totalCredits={gpaData.totalCredits} history={history} />
      </Section>

      {gpaData.courses.length > 0 && (
        <Section id="breakdown" icon={FlaskConical} title="Course GPA Breakdown" description="Drag the what-if sliders to see how grade changes affect your GPA." delay={0.1}>
          <CourseBreakdown courses={gpaData.courses} currentGpa={gpaData.currentGpa} />
        </Section>
      )}

      {gpaData.courses.length > 0 && (
        <Section id="simulator" icon={Target} title="Scenario Simulator" description="Create and compare grade scenarios to plan your semester." delay={0.15}>
          <ScenarioSimulator courses={gpaData.courses} currentGpa={gpaData.currentGpa} />
        </Section>
      )}

      {gpaData.courses.length > 0 && (
        <Section id="advisor" icon={Sparkles} title="GPA Advisor" description="AI-powered study recommendations ranked by GPA impact." delay={0.2}>
          <GpaAdvisor />
        </Section>
      )}
    </div>
  );
}
