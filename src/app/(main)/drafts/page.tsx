"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileEdit, Clock, AlignLeft, ChevronRight, Inbox, Trash2, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface DraftListItem {
  id: string; assignmentId: string; content: string; predictedGrade: string | null;
  version: number; status: string; wordCount: number | null; createdAt: string;
  assignment: { title: string; course: { name: string; code: string } };
}

interface TaskOption { id: string; title: string; course?: { name: string; code: string } | null; }

const statusConfig: Record<string, { label: string; color: string; dotColor: string }> = {
  GENERATING: { label: "Generating", color: "text-phantom-warning", dotColor: "bg-phantom-warning" },
  GENERATED: { label: "Ready for Review", color: "text-phantom-text", dotColor: "bg-phantom-text" },
  REVIEW: { label: "Ready for Review", color: "text-phantom-text", dotColor: "bg-phantom-text" },
  REVISED: { label: "Revised", color: "text-phantom-textSecondary", dotColor: "bg-phantom-textTertiary" },
  SUBMITTED: { label: "Submitted", color: "text-phantom-success", dotColor: "bg-phantom-success" },
};

function getStatusConfig(status: string) {
  return statusConfig[status] || { label: status, color: "text-phantom-textMuted", dotColor: "bg-phantom-textMuted" };
}

function gradeVariant(grade: string | null): "success" | "warning" | "danger" | "default" {
  if (!grade) return "default";
  if (grade.startsWith("A")) return "success";
  if (grade.startsWith("B")) return "warning";
  return "danger";
}

const STATUS_ORDER = ["GENERATING", "GENERATED", "REVIEW", "REVISED", "SUBMITTED"];

function groupByStatus(drafts: DraftListItem[]): Record<string, DraftListItem[]> {
  const groups: Record<string, DraftListItem[]> = {};
  for (const d of drafts) { const k = d.status || "UNKNOWN"; if (!groups[k]) groups[k] = []; groups[k].push(d); }
  return groups;
}

function DraftCard({ draft, index, onDelete }: { draft: DraftListItem; index: number; onDelete: (id: string) => void }) {
  const status = getStatusConfig(draft.status);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04, duration: 0.3 }}>
      <div className="relative group">
        <Link href={`/drafts/${draft.id}`}>
          <div className={cn("flex items-center gap-4 p-4 rounded-lg", "border border-phantom-border bg-phantom-bgCard", "hover:border-phantom-borderHover hover:bg-phantom-bgCardHover", "hover:-translate-y-px transition-all duration-200 cursor-pointer")}>
            <div className={cn("w-10 h-10 rounded-lg shrink-0", "bg-phantom-accentBg border border-phantom-border", "flex items-center justify-center")}>
              <FileEdit className="w-4 h-4 text-phantom-textTertiary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-card-title text-phantom-text truncate">{draft.assignment?.title || "Untitled Draft"}</h3>
                {draft.predictedGrade && <Badge variant={gradeVariant(draft.predictedGrade)} className="text-[10px]">Est: {draft.predictedGrade}</Badge>}
              </div>
              <div className="flex items-center gap-3 text-caption text-phantom-textTertiary">
                <span className="font-mono text-phantom-textMuted">{draft.assignment?.course?.code}</span>
                <span className="flex items-center gap-1"><span className={cn("w-1.5 h-1.5 rounded-full", status.dotColor)} /><span className={status.color}>{status.label}</span></span>
                <span>v{draft.version}</span>
                {draft.wordCount != null && <span className="flex items-center gap-1"><AlignLeft className="w-3 h-3" />{draft.wordCount.toLocaleString()} words</span>}
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatRelativeTime(draft.createdAt)}</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-phantom-textMuted shrink-0" />
          </div>
        </Link>
        <div className="absolute top-3 right-10 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {deleteConfirm ? (
            <div className="flex items-center gap-1 bg-phantom-bgCard border border-phantom-border rounded-md p-1">
              <button onClick={(e) => { e.preventDefault(); onDelete(draft.id); }} className="px-2 py-0.5 rounded text-[10px] bg-phantom-danger/10 text-phantom-danger hover:bg-phantom-danger/20 transition-colors">Delete</button>
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

function GenerateDraftSection({ onGenerated }: { onGenerated: () => void }) {
  const [tasks, setTasks] = useState<TaskOption[]>([]);
  const [selectedTask, setSelectedTask] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function f() {
      try {
        const res = await fetch("/api/tasks");
        if (res.ok) { const d = await res.json(); setTasks((d.tasks || []).map((t: TaskOption) => ({ id: t.id, title: t.title, course: t.course }))); }
      } catch { /* */ }
    }
    f();
  }, []);

  const handleGenerate = async () => {
    if (!selectedTask) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/drafts/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assignmentId: selectedTask }) });
      if (res.ok) onGenerated();
    } catch { /* */ } finally { setGenerating(false); }
  };

  return (
    <div className={cn("flex items-center gap-3 p-3 rounded-lg", "border border-phantom-border bg-phantom-bgCard")}>
      <Sparkles className="w-4 h-4 text-phantom-textMuted shrink-0" />
      <select value={selectedTask} onChange={(e) => setSelectedTask(e.target.value)}
        className={cn("flex-1 h-8 px-2 rounded-md text-caption", "bg-phantom-bgInput border border-phantom-border text-phantom-text", "focus:outline-none")}>
        <option value="">Select an assignment to generate a draft...</option>
        {tasks.map((t) => <option key={t.id} value={t.id}>{t.course?.code ? `[${t.course.code}] ` : ""}{t.title}</option>)}
      </select>
      <Button variant="primary" size="sm" onClick={handleGenerate} disabled={!selectedTask || generating}>
        {generating ? "Generating..." : "Generate Draft"}
      </Button>
    </div>
  );
}

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<DraftListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDrafts = useCallback(async () => {
    try { const res = await fetch("/api/drafts"); if (res.ok) { const d = await res.json(); setDrafts(d.drafts || []); } } catch { /* */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDrafts(); }, [fetchDrafts]);

  const handleDelete = async (id: string) => {
    try { const res = await fetch(`/api/drafts/${id}`, { method: "DELETE" }); if (res.ok) setDrafts((p) => p.filter((d) => d.id !== id)); } catch { /* */ }
  };

  const groups = groupByStatus(drafts);
  const orderedStatuses = STATUS_ORDER.filter((s) => groups[s]?.length);
  const extraStatuses = Object.keys(groups).filter((s) => !STATUS_ORDER.includes(s) && groups[s]?.length);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-start justify-between mb-6"><div><h1 className="text-page-title text-phantom-text mb-1">Draft Factory</h1><p className="text-body text-phantom-textSecondary">AI-generated drafts for your assignments. Review, refine, and submit.</p></div></div>

      <div className="mb-6"><GenerateDraftSection onGenerated={fetchDrafts} /></div>

      {loading ? (
        <div className="space-y-6">{[1,2].map(g=><div key={g} className="space-y-3"><Skeleton className="h-4 w-32"/>{[1,2,3].map(i=><div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-phantom-border"><Skeleton className="w-10 h-10 rounded-lg"/><div className="flex-1 space-y-2"><Skeleton className="h-4 w-2/5"/><Skeleton className="h-3 w-1/3"/></div></div>)}</div>)}</div>
      ) : drafts.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cn("flex flex-col items-center justify-center py-20", "rounded-lg border border-dashed border-phantom-border")}>
          <div className="w-12 h-12 rounded-full bg-phantom-accentBg flex items-center justify-center mb-4"><Inbox className="w-5 h-5 text-phantom-textMuted" /></div>
          <p className="text-body text-phantom-textSecondary mb-1">No drafts yet</p><p className="text-caption text-phantom-textMuted">Select an assignment above and click Generate Draft to get started.</p>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {[...orderedStatuses, ...extraStatuses].map((status) => {
            const items = groups[status]; if (!items?.length) return null; const config = getStatusConfig(status);
            return (<div key={status}><div className="flex items-center gap-2 mb-3"><span className={cn("w-2 h-2 rounded-full", config.dotColor)}/><h2 className="text-label-mono text-phantom-textMuted uppercase">{config.label}</h2><span className="text-caption text-phantom-textMuted">({items.length})</span></div><div className="space-y-2">{items.map((d,i)=><DraftCard key={d.id} draft={d} index={i} onDelete={handleDelete}/>)}</div></div>);
          })}
        </div>
      )}
    </div>
  );
}
