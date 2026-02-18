"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Pin,
  PinOff,
  MessageSquare,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { Conversation } from "@/types";

/* -------------------------------------------------------------------------- */
/*  Date grouping helpers                                                      */
/* -------------------------------------------------------------------------- */

type DateGroup = "Pinned" | "Today" | "Yesterday" | "This Week" | "Older";

function getDateGroup(dateStr: string, isPinned: boolean): DateGroup {
  if (isPinned) return "Pinned";

  const date = new Date(dateStr);
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  if (date >= startOfToday) return "Today";
  if (date >= startOfYesterday) return "Yesterday";
  if (date >= startOfWeek) return "This Week";
  return "Older";
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* -------------------------------------------------------------------------- */
/*  Props                                                                      */
/* -------------------------------------------------------------------------- */

interface ChatSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  isLoading: boolean;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onTogglePin: (id: string) => void;
  onClose?: () => void;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function ChatSidebar({
  conversations,
  activeId,
  isLoading,
  onSelect,
  onNewChat,
  onTogglePin,
  onClose,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  /* ---- Filter by search ---- */
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.title?.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  /* ---- Group conversations ---- */
  const grouped = useMemo(() => {
    const groups: Record<DateGroup, Conversation[]> = {
      Pinned: [],
      Today: [],
      Yesterday: [],
      "This Week": [],
      Older: [],
    };

    for (const conv of filtered) {
      const group = getDateGroup(conv.updatedAt, conv.isPinned);
      groups[group].push(conv);
    }

    /* Sort each group by most recent first */
    for (const key of Object.keys(groups) as DateGroup[]) {
      groups[key].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    }

    return groups;
  }, [filtered]);

  const groupOrder: DateGroup[] = [
    "Pinned",
    "Today",
    "Yesterday",
    "This Week",
    "Older",
  ];

  const handleSelect = useCallback(
    (id: string) => {
      onSelect(id);
      onClose?.();
    },
    [onSelect, onClose]
  );

  return (
    <div className="flex flex-col h-full bg-phantom-bgSecondary">
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-phantom-border">
        <h3 className="text-[13px] font-semibold text-phantom-text tracking-tight">
          Conversations
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={onNewChat}
            className={cn(
              "flex items-center justify-center",
              "w-8 h-8 rounded-sm",
              "text-phantom-textTertiary hover:text-phantom-text",
              "hover:bg-phantom-bgCard",
              "transition-colors"
            )}
            aria-label="New conversation"
          >
            <Plus size={16} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className={cn(
                "flex items-center justify-center md:hidden",
                "w-8 h-8 rounded-sm",
                "text-phantom-textTertiary hover:text-phantom-text",
                "hover:bg-phantom-bgCard",
                "transition-colors"
              )}
              aria-label="Close sidebar"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ---- Search ---- */}
      <div className="px-3 py-2">
        <div
          className={cn(
            "flex items-center gap-2",
            "h-8 px-2.5 rounded-md",
            "bg-phantom-bgInput border border-phantom-border",
            "focus-within:border-phantom-borderHover",
            "transition-colors"
          )}
        >
          <Search size={13} className="text-phantom-textMuted flex-shrink-0" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "flex-1 bg-transparent border-none outline-none",
              "text-[12px] text-phantom-text",
              "placeholder:text-phantom-textMuted"
            )}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-phantom-textMuted hover:text-phantom-text transition-colors"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* ---- Conversation list ---- */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {isLoading ? (
          <div className="space-y-2 px-2 pt-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-1.5 py-2">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-2.5 w-1/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <MessageSquare
              size={24}
              className="text-phantom-textMuted mb-2"
            />
            <p className="text-caption text-phantom-textMuted text-center">
              {searchQuery
                ? "No conversations match your search"
                : "No conversations yet"}
            </p>
            {!searchQuery && (
              <button
                onClick={onNewChat}
                className={cn(
                  "mt-3 px-3 py-1.5 rounded-md",
                  "text-[12px] font-medium",
                  "bg-phantom-bgCard border border-phantom-border",
                  "text-phantom-textSecondary hover:text-phantom-text",
                  "hover:border-phantom-borderHover",
                  "transition-all"
                )}
              >
                Start a conversation
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {groupOrder.map((group) => {
              const items = grouped[group];
              if (items.length === 0) return null;

              return (
                <div key={group}>
                  <p className="px-2 pt-3 pb-1 text-[10px] font-mono font-medium uppercase tracking-[0.08em] text-phantom-textMuted">
                    {group}
                  </p>
                  <AnimatePresence mode="popLayout">
                    {items.map((conv) => (
                      <motion.button
                        key={conv.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => handleSelect(conv.id)}
                        className={cn(
                          "group w-full flex items-center gap-2",
                          "px-2.5 py-2 rounded-md",
                          "text-left",
                          "transition-colors duration-150",
                          activeId === conv.id
                            ? "bg-phantom-bgCard border border-phantom-border"
                            : "hover:bg-phantom-bgCard/50 border border-transparent"
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              "text-[12px] font-medium truncate",
                              activeId === conv.id
                                ? "text-phantom-text"
                                : "text-phantom-textSecondary"
                            )}
                          >
                            {conv.title || "New conversation"}
                          </p>
                          <p className="text-[10px] font-mono text-phantom-textMuted mt-0.5">
                            {formatTime(conv.updatedAt)}
                          </p>
                        </div>

                        {/* Pin / Unpin button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePin(conv.id);
                          }}
                          className={cn(
                            "flex items-center justify-center",
                            "w-6 h-6 rounded flex-shrink-0",
                            "transition-all",
                            conv.isPinned
                              ? "text-phantom-textSecondary hover:text-phantom-textMuted"
                              : "opacity-0 group-hover:opacity-100 text-phantom-textMuted hover:text-phantom-textSecondary"
                          )}
                          aria-label={
                            conv.isPinned ? "Unpin conversation" : "Pin conversation"
                          }
                        >
                          {conv.isPinned ? (
                            <PinOff size={12} />
                          ) : (
                            <Pin size={12} />
                          )}
                        </button>
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
