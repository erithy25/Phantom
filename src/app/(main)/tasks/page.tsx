"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckSquare, Inbox, Plus, Trash2, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskFilters, type TaskFilter, type TaskSort } from "@/components/tasks/task-filters";
import type { Assignment } from "@/types";

/* -------------------------------------------------------------------------- */
/*  Filter / Sort Logic                                                        */
/* -------------------------------------------------------------------------- */

function isOverdue(task: Assignment): boolean {
  if (!task.dueDate) return false;
  if (task.status === "SUBMITTED" || task.status === "GRADED") return false;
  return new Date(task.dueDate).getTime() < Date.now();
}

function isDueToday(task: Assignment): boolean {
  if (!task.dueDate) return false;
  const due = new Date(task.dueDate);
  const now = new Date();
  return due.getDate() === now.getDate() && due.getMonth() === now.getMonth() && due.getFullYear() === now.getFullYear() && !isOverdue(task);
}

function isDueThisWeek(task: Assignment): boolean {
  if (!task.dueDate) return false;
  const due = new Date(task.dueDate);
  const now = new Date();
  return due >= now && due <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
}

function filterTasks(tasks: Assignment[], filter: TaskFilter): Assignment[] {
  switch (filter) {
    case "due_today": return tasks.filter(isDueToday);
    case "due_week": return tasks.filter(isDueThisWeek);
    case "draft_ready": return tasks.filter((t) => t.status === "DRAFT_READY");
    case "overdue": return tasks.filter(isOverdue);
    default: return tasks;
  }
}

function sortTasks(tasks: Assignment[], sort: TaskSort): Assignment[] {
  const sorted = [...tasks];
  switch (sort) {
    case "due_date": return sorted.sort((a, b) => { if (!a.dueDate) return 1; if (!b.dueDate) return -1; return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(); });
    case "priority": { const p: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 }; return sorted.sort((a, b) => (p[a.priority] ?? 2) - (p[b.priority] ?? 2)); }
    case "course": return sorted.sort((a, b) => (a.course?.code ?? "").localeCompare(b.course?.code ?? ""));
    case "gpa_impact": return sorted.sort((a, b) => (b.gpaImpact ?? 0) - (a.gpaImpact ?? 0));
    default: return sorted;
  }
}

/* -------------------------------------------------------------------------- */
/*  Task Form                                                                  */
/* -------------------------------------------------------------------------- */

interface TaskFormData { title: string; description: string; dueDate: string; priority: string; courseId: string; estimatedTime: number | null; }
const EMPTY_TASK_FORM: TaskFormData = { title: "", description: "", dueDate: "", priority: "MEDIUM", courseId: "", estimatedTime: null };
interface CourseOption { id: string; name: string; code: string; }

function TaskForm({ initial, courses, onSubmit, onCancel, isSubmitting, submitLabel }: {
  initial: TaskFormData; courses: CourseOption[]; onSubmit: (d: TaskFormData) => void; onCancel: () => void; isSubmitting: boolean; submitLabel: string;
}) {
  const [form, setForm] = useState<TaskFormData>(initial);
  return (
    <div className="space-y-4 p-4 rounded-lg border border-phantom-borderHover bg-phantom-bgCard">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-caption text-phantom-textMuted block mb-1">Title *</label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Essay on Climate Change" />
        </div>
        <div className="col-span-2">
          <label className="text-caption text-phantom-textMuted block mb-1">Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What needs to be done..."
            className={cn("w-full min-h-[60px] px-3 py-2 rounded-md text-body", "bg-phantom-bgInput border border-phantom-border text-phantom-text", "placeholder:text-phantom-textMuted resize-none", "focus:outline-none focus:border-phantom-borderHover")} />
        </div>
        <div>
          <label className="text-caption text-phantom-textMuted block mb-1">Course</label>
          <select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}
            className={cn("w-full h-9 px-3 rounded-md text-body", "bg-phantom-bgInput border border-phantom-border text-phantom-text", "focus:outline-none focus:border-phantom-borderHover")}>
            <option value="">Select course...</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.code} {c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-caption text-phantom-textMuted block mb-1">Due Date</label>
          <Input type="datetime-local" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
        </div>
        <div>
          <label className="text-caption text-phantom-textMuted block mb-1">Priority</label>
          <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
            className={cn("w-full h-9 px-3 rounded-md text-body", "bg-phantom-bgInput border border-phantom-border text-phantom-text", "focus:outline-none focus:border-phantom-borderHover")}>
            <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option>
          </select>
        </div>
        <div>
          <label className="text-caption text-phantom-textMuted block mb-1">Estimated Time (min)</label>
          <Input type="number" min={0} value={form.estimatedTime ?? ""} onChange={(e) => setForm({ ...form, estimatedTime: e.target.value ? Number(e.target.value) : null })} placeholder="60" />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="default" size="sm" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" size="sm" onClick={() => onSubmit(form)} disabled={!form.title.trim() || isSubmitting}>{isSubmitting ? "Saving..." : submitLabel}</Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  AI Generate Tasks                                                          */
/* -------------------------------------------------------------------------- */

function AIGenerateTasks({ courses, onGenerated }: { courses: CourseOption[]; onGenerated: () => void }) {
  const [generating, setGenerating] = useState(false);
  const [courseId, setCourseId] = useState("");

  const handleGenerate = async () => {
    if (!courseId) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/tasks/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ courseId }) });
      if (res.ok) onGenerated();
    } catch { /* */ } finally { setGenerating(false); }
  };

  return (
    <div className={cn("flex items-center gap-3 p-3 rounded-lg", "border border-phantom-border bg-phantom-bgCard")}>
      <Sparkles className="w-4 h-4 text-phantom-textMuted shrink-0" />
      <select value={courseId} onChange={(e) => setCourseId(e.target.value)}
        className={cn("flex-1 h-8 px-2 rounded-md text-caption", "bg-phantom-bgInput border border-phantom-border text-phantom-text", "focus:outline-none")}>
        <option value="">Select a course to generate tasks...</option>
        {courses.map((c) => <option key={c.id} value={c.id}>{c.code} {c.name}</option>)}
      </select>
      <Button variant="primary" size="sm" onClick={handleGenerate} disabled={!courseId || generating}>
        {generating ? "Generating..." : "Auto-Generate"}
      </Button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Task Row with Delete                                                       */
/* -------------------------------------------------------------------------- */

function TaskRow({ task, index, onDelete }: { task: Assignment; index: number; onUpdate: () => void; onDelete: (id: string) => void }) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  return (
    <div className="relative group">
      <TaskCard task={task} index={index} />
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {deleteConfirm ? (
          <div className="flex items-center gap-1 bg-phantom-bgCard border border-phantom-border rounded-md p-1">
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(task.id); }} className="px-2 py-0.5 rounded text-[10px] bg-phantom-danger/10 text-phantom-danger hover:bg-phantom-danger/20 transition-colors">Confirm</button>
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteConfirm(false); }} className="p-0.5 rounded text-phantom-textMuted hover:text-phantom-text transition-colors"><X className="w-3 h-3" /></button>
          </div>
        ) : (
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteConfirm(true); }} className="p-1.5 rounded-md bg-phantom-bgCard border border-phantom-border text-phantom-textMuted hover:text-phantom-danger hover:bg-phantom-danger/10 transition-colors">
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function TasksPage() {
  const [tasks, setTasks] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<TaskFilter>("all");
  const [activeSort, setActiveSort] = useState<TaskSort>("due_date");
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, cRes] = await Promise.allSettled([fetch("/api/tasks"), fetch("/api/courses")]);
      if (tRes.status === "fulfilled" && tRes.value.ok) { const d = await tRes.value.json(); setTasks(d.tasks ?? []); }
      if (cRes.status === "fulfilled" && cRes.value.ok) { const d = await cRes.value.json(); setCourses((d.courses || []).map((c: CourseOption) => ({ id: c.id, name: c.name, code: c.code }))); }
    } catch { /* */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleAddTask = async (form: TaskFormData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/tasks/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: form.title, description: form.description || null, dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null, priority: form.priority, courseId: form.courseId || null, estimatedTime: form.estimatedTime }) });
      if (res.ok) { setShowAddForm(false); await fetchTasks(); }
    } catch { /* */ } finally { setIsSubmitting(false); }
  };

  const handleDeleteTask = async (id: string) => {
    try { const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" }); if (res.ok) setTasks((p) => p.filter((t) => t.id !== id)); } catch { /* */ }
  };

  const counts = useMemo(() => ({ all: tasks.length, due_today: tasks.filter(isDueToday).length, due_week: tasks.filter(isDueThisWeek).length, draft_ready: tasks.filter((t) => t.status === "DRAFT_READY").length, overdue: tasks.filter(isOverdue).length }), [tasks]);
  const displayTasks = useMemo(() => sortTasks(filterTasks(tasks, activeFilter), activeSort), [tasks, activeFilter, activeSort]);

  return (
    <div className="max-w-[900px] mx-auto px-6 py-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex items-center justify-between">
        <div><h1 className="text-page-title text-phantom-text">Task Command Center</h1><p className="text-body text-phantom-textSecondary mt-1">Track assignments, review drafts, and manage deadlines.</p></div>
        <div className="flex items-center gap-3">
          <Button variant="primary" size="sm" onClick={() => setShowAddForm(!showAddForm)}><Plus className="w-3.5 h-3.5" />Add Task</Button>
          <div className="flex items-center gap-2"><CheckSquare className="w-5 h-5 text-phantom-textMuted" /><span className="font-mono text-[18px] font-semibold text-phantom-text tabular-nums">{counts.all}</span></div>
        </div>
      </motion.div>

      {courses.length > 0 && <AIGenerateTasks courses={courses} onGenerated={fetchTasks} />}

      <AnimatePresence>{showAddForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
          <TaskForm initial={EMPTY_TASK_FORM} courses={courses} onSubmit={handleAddTask} onCancel={() => setShowAddForm(false)} isSubmitting={isSubmitting} submitLabel="Create Task" />
        </motion.div>
      )}</AnimatePresence>

      <TaskFilters activeFilter={activeFilter} activeSort={activeSort} onFilterChange={setActiveFilter} onSortChange={setActiveSort} counts={counts} />

      {loading ? <div className="space-y-3">{[1,2,3,4,5].map(i=><div key={i} className="rounded-lg border border-phantom-border p-4 space-y-3"><div className="flex items-center gap-3"><Skeleton className="w-2 h-2 rounded-full"/><Skeleton className="h-3 w-48"/><div className="flex-1"/><Skeleton className="h-5 w-20 rounded-full"/></div></div>)}</div>
      : displayTasks.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="w-10 h-10 text-phantom-textMuted mb-3" /><p className="text-body text-phantom-textSecondary mb-1">No tasks match this filter</p><p className="text-caption text-phantom-textMuted">Add tasks manually or use AI to auto-generate from your courses.</p>
        </motion.div>
      ) : (
        <div className="space-y-2">{displayTasks.map((t, i) => <TaskRow key={t.id} task={t} index={i} onUpdate={fetchTasks} onDelete={handleDeleteTask} />)}</div>
      )}
    </div>
  );
}
