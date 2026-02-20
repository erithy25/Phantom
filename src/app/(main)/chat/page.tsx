"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store";
import { ChatInterface } from "@/components/chat/chat-interface";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import type { Conversation, ChatMessage } from "@/types";

export default function ChatPage() {
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

  /* ----------------------------- Fetch conversations ----------------------------- */
  const fetchConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/chat/conversations");
      if (!res.ok) throw new Error("Failed to fetch conversations");
      const data = await res.json();
      setConversations(data.conversations ?? []);
    } catch {
      /* silently fail -- empty state will render */
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  /* ----------------------------- Load conversation messages ----------------------------- */
  const loadConversation = useCallback(
    async (id: string) => {
      setActiveConversation(id);
      setIsLoadingMessages(true);
      try {
        const res = await fetch(`/api/chat/conversations/${id}`);
        if (!res.ok) throw new Error("Failed to fetch messages");
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

  /* ----------------------------- Start new conversation ----------------------------- */
  const startNewConversation = useCallback(() => {
    setActiveConversation(null);
    setMessages([]);
  }, [setActiveConversation]);

  /* ----------------------------- Delete conversation ----------------------------- */
  const deleteConversation = useCallback(
    async (conversationId: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      if (activeConversationId === conversationId) {
        setActiveConversation(null);
        setMessages([]);
      }
      try {
        await fetch(`/api/chat/conversations/${conversationId}`, {
          method: "DELETE",
        });
      } catch {
        fetchConversations();
      }
    },
    [activeConversationId, setActiveConversation, fetchConversations]
  );

  /* ----------------------------- Pin / unpin ----------------------------- */
  const togglePin = useCallback(
    async (conversationId: string) => {
      const target = conversations.find((c) => c.id === conversationId);
      if (!target) return;

      const updated = conversations.map((c) =>
        c.id === conversationId ? { ...c, isPinned: !c.isPinned } : c
      );
      setConversations(updated);

      try {
        await fetch(`/api/chat/conversations/${conversationId}`, {
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

  /* ----------------------------- On message sent ----------------------------- */
  const handleConversationUpdate = useCallback(
    (updatedConversation: Conversation) => {
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === updatedConversation.id);
        if (exists) {
          return prev.map((c) =>
            c.id === updatedConversation.id ? updatedConversation : c
          );
        }
        return [updatedConversation, ...prev];
      });
      if (!activeConversationId) {
        setActiveConversation(updatedConversation.id);
      }
    },
    [activeConversationId, setActiveConversation]
  );

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* ---- Mobile sidebar toggle ---- */}
      <button
        onClick={toggleSidebar}
        className={cn(
          "fixed top-[72px] left-4 z-50 md:hidden",
          "flex h-9 w-9 items-center justify-center",
          "rounded-xl bg-phantom-bgCard border border-phantom-border",
          "text-phantom-textSecondary hover:text-phantom-text",
          "shadow-sm transition-colors"
        )}
        aria-label="Toggle chat sidebar"
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
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed inset-y-0 left-0 top-16 z-40 w-[300px] md:hidden"
            >
              <ChatSidebar
                conversations={conversations}
                activeId={activeConversationId}
                isLoading={isLoading}
                onSelect={loadConversation}
                onNewChat={startNewConversation}
                onTogglePin={togglePin}
                onDelete={deleteConversation}
                onClose={() => {
                  if (isSidebarOpen) toggleSidebar();
                }}
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

      {/* ---- Main chat area ---- */}
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
