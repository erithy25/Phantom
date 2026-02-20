"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Ghost, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store";
import { ChatInterface } from "@/components/chat/chat-interface";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import type { Conversation, ChatMessage } from "@/types";

export default function StandaloneChatPage() {
  const router = useRouter();
  const {
    activeConversationId,
    setActiveConversation,
    isSidebarOpen,
    toggleSidebar,
  } = useChatStore();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [planChecked, setPlanChecked] = useState(false);

  /* ---- Check subscription ---- */
  useEffect(() => {
    async function checkPlan() {
      try {
        const res = await fetch("/api/subscription", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.plan === "PRO" || data.plan === "GHOST") {
            setPlanChecked(true);
          } else {
            router.replace("/upgrade");
          }
        } else {
          router.replace("/upgrade");
        }
      } catch {
        router.replace("/upgrade");
      }
    }
    checkPlan();
  }, [router]);

  /* ---- Fetch conversations ---- */
  const fetchConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/chat/conversations");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setConversations(data.conversations ?? []);
    } catch {
      /* empty state */
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (planChecked) fetchConversations();
  }, [planChecked, fetchConversations]);

  /* ---- Load conversation ---- */
  const loadConversation = useCallback(
    async (id: string) => {
      setActiveConversation(id);
      setIsLoadingMessages(true);
      try {
        const res = await fetch(`/api/chat/conversations/${id}`);
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        const conv = data.conversation;
        const msgs: ChatMessage[] = (conv?.messages ?? []).map(
          (m: { id: string; role: string; content: string; createdAt: string }) => ({
            id: m.id,
            role: m.role === "assistant" ? "phantom" : m.role,
            content: m.content,
            createdAt: m.createdAt,
          })
        );
        setMessages(msgs);
      } catch {
        setMessages([]);
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [setActiveConversation]
  );

  /* ---- New / Delete / Pin ---- */
  const startNewConversation = useCallback(() => {
    setActiveConversation(null);
    setMessages([]);
  }, [setActiveConversation]);

  const deleteConversation = useCallback(
    async (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        setActiveConversation(null);
        setMessages([]);
      }
      try {
        await fetch(`/api/chat/conversations/${id}`, { method: "DELETE" });
      } catch {
        fetchConversations();
      }
    },
    [activeConversationId, setActiveConversation, fetchConversations]
  );

  const togglePin = useCallback(
    async (id: string) => {
      const target = conversations.find((c) => c.id === id);
      if (!target) return;
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isPinned: !c.isPinned } : c))
      );
      try {
        await fetch(`/api/chat/conversations/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPinned: !target.isPinned }),
        });
      } catch {
        setConversations(conversations);
      }
    },
    [conversations]
  );

  const handleConversationUpdate = useCallback(
    (conv: Conversation) => {
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === conv.id);
        if (exists) return prev.map((c) => (c.id === conv.id ? conv : c));
        return [conv, ...prev];
      });
      if (!activeConversationId) setActiveConversation(conv.id);
    },
    [activeConversationId, setActiveConversation]
  );

  if (!planChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-phantom-border border-t-phantom-text animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ---- Mobile toggle ---- */}
      <button
        onClick={toggleSidebar}
        className={cn(
          "fixed top-3 left-3 z-50 md:hidden",
          "flex h-9 w-9 items-center justify-center",
          "rounded-xl bg-phantom-bgCard border border-phantom-border",
          "text-phantom-textSecondary hover:text-phantom-text",
          "shadow-sm transition-colors"
        )}
      >
        {isSidebarOpen ? <X size={16} /> : <Menu size={16} />}
      </button>

      {/* ---- Mobile sidebar ---- */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/50 md:hidden"
              onClick={toggleSidebar}
            />
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-y-0 left-0 z-40 w-[300px] md:hidden"
            >
              <ChatSidebar
                conversations={conversations}
                activeId={activeConversationId}
                isLoading={isLoading}
                onSelect={loadConversation}
                onNewChat={startNewConversation}
                onTogglePin={togglePin}
                onDelete={deleteConversation}
                onClose={() => { if (isSidebarOpen) toggleSidebar(); }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ---- Desktop sidebar ---- */}
      <div className="hidden md:block w-[300px] flex-shrink-0 border-r border-phantom-border">
        <ChatSidebar
          conversations={conversations}
          activeId={activeConversationId}
          isLoading={isLoading}
          onSelect={loadConversation}
          onNewChat={startNewConversation}
          onTogglePin={togglePin}
          onDelete={deleteConversation}
        />
      </div>

      {/* ---- Main chat ---- */}
      <div className="flex-1 min-w-0">
        <ChatInterface
          conversationId={activeConversationId}
          messages={messages}
          setMessages={setMessages}
          isLoadingMessages={isLoadingMessages}
          onConversationUpdate={handleConversationUpdate}
        />
      </div>
    </div>
  );
}
