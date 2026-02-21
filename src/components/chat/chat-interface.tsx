"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
  type Dispatch,
  type SetStateAction,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Ghost, Sparkles, StopCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { MessageBubble } from "@/components/chat/message-bubble";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import type { ChatMessage, Conversation } from "@/types";

/* -------------------------------------------------------------------------- */
/*  Quick action pills                                                         */
/* -------------------------------------------------------------------------- */

const QUICK_ACTIONS = [
  { label: "Summarize my lectures", icon: "book" },
  { label: "Help me study for my exam", icon: "brain" },
  { label: "Write an essay outline", icon: "pen" },
  { label: "Optimize my GPA strategy", icon: "chart" },
] as const;

/* -------------------------------------------------------------------------- */
/*  Props                                                                      */
/* -------------------------------------------------------------------------- */

interface ChatInterfaceProps {
  conversationId: string | null;
  messages: ChatMessage[];
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  isLoadingMessages: boolean;
  onConversationUpdate: (conversation: Conversation) => void;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function ChatInterface({
  conversationId,
  messages,
  setMessages,
  isLoadingMessages,
  onConversationUpdate,
}: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const isNewConversation = !conversationId && messages.length === 0;

  /* ---- Auto-scroll on new messages ---- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  /* ---- Auto-resize textarea ---- */
  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [inputValue, resizeTextarea]);

  /* ---- Stop streaming ---- */
  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  }, []);

  /* ---- Send message ---- */
  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isStreaming) return;

      setInputValue("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      const userMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const res = await fetch("/api/chat/message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            message: trimmed,
          }),
          signal: abortController.signal,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Server error (${res.status})`);
        }

        const newConversationId = res.headers.get("X-Conversation-Id");

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error("No response stream");

        let phantomContent = "";
        const phantomMessageId = `phantom-${Date.now()}`;

        const phantomMessage: ChatMessage = {
          id: phantomMessageId,
          role: "phantom",
          content: "",
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, phantomMessage]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          phantomContent += chunk;

          setMessages((prev) =>
            prev.map((m) =>
              m.id === phantomMessageId
                ? { ...m, content: phantomContent }
                : m
            )
          );
        }

        if (newConversationId) {
          const convData: Conversation = {
            id: newConversationId,
            title: trimmed.length > 50 ? trimmed.substring(0, 50) + "..." : trimmed,
            isPinned: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          onConversationUpdate(convData);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        const detail = err instanceof Error ? err.message : "Unknown error";
        const lowerDetail = detail.toLowerCase();

        let friendlyMessage: string;
        if (lowerDetail.includes("anthropic_api_key") || lowerDetail.includes("api key") || lowerDetail.includes("api_key")) {
          friendlyMessage = "The AI service is not connected. The ANTHROPIC_API_KEY environment variable is missing or invalid.\n\nTo fix this:\n1. Go to your Vercel project dashboard\n2. Open Settings → Environment Variables\n3. Add ANTHROPIC_API_KEY with your key from console.anthropic.com\n4. Redeploy the project";
        } else if (lowerDetail.includes("not authenticated") || lowerDetail.includes("unauthorized") || detail.includes("401")) {
          friendlyMessage = "Your session has expired. Please refresh the page and log in again.";
        } else if (lowerDetail.includes("database") || lowerDetail.includes("prisma") || lowerDetail.includes("connection")) {
          friendlyMessage = "Could not connect to the database. Make sure DATABASE_URL is set correctly in your Vercel environment variables.";
        } else if (lowerDetail.includes("model")) {
          friendlyMessage = "The AI model could not be loaded. Check the Vercel deployment logs for details.";
        } else {
          friendlyMessage = `I ran into an issue processing your request: ${detail}`;
        }

        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: "phantom",
          content: friendlyMessage,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [conversationId, isStreaming, onConversationUpdate, setMessages]
  );

  /* ---- Keyboard handler ---- */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage(inputValue);
      }
    },
    [inputValue, sendMessage]
  );

  return (
    <div className="flex flex-col h-full bg-phantom-bg">
      {/* ================================================================= */}
      {/*  Messages area                                                     */}
      {/* ================================================================= */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
      >
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-phantom-bgCard border border-phantom-border flex items-center justify-center">
                <Ghost size={24} className="text-phantom-textMuted animate-pulse" />
              </div>
              <p className="text-sm text-phantom-textMuted">
                Loading conversation...
              </p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          /* ---- Empty / New conversation state ---- */
          <div className="flex flex-col items-center justify-center h-full px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center gap-2 mb-8"
            >
              <div
                className={cn(
                  "w-16 h-16 rounded-2xl",
                  "bg-gradient-to-br from-phantom-bgCard to-phantom-bgSecondary",
                  "border border-phantom-border",
                  "flex items-center justify-center",
                  "shadow-lg shadow-black/20"
                )}
              >
                <Ghost size={32} className="text-phantom-textSecondary" />
              </div>
              <h2 className="text-xl font-semibold text-phantom-text tracking-tight mt-3">
                Phantom AI
              </h2>
              <p className="text-sm text-phantom-textMuted text-center max-w-sm">
                Your personal academic assistant. Ask me anything about your
                courses, assignments, or study plans.
              </p>
              <p className="text-xs text-phantom-textMuted/60 italic mt-1">
                Because showing up is optional.
              </p>
            </motion.div>

            {/* Quick action pills */}
            <AnimatePresence>
              {isNewConversation && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="w-full max-w-lg"
                >
                  <div className="grid grid-cols-2 gap-2.5">
                    {QUICK_ACTIONS.map((action, i) => (
                      <motion.button
                        key={action.label}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.08 }}
                        onClick={() => sendMessage(action.label)}
                        className={cn(
                          "flex items-center gap-2.5",
                          "px-4 py-3 rounded-xl",
                          "bg-phantom-bgCard border border-phantom-border",
                          "text-[13px] text-phantom-textSecondary",
                          "hover:border-phantom-borderHover hover:text-phantom-text",
                          "hover:bg-phantom-bgCardHover",
                          "transition-all duration-200",
                          "active:scale-[0.98]",
                          "text-left"
                        )}
                      >
                        <Sparkles size={14} className="text-phantom-textMuted flex-shrink-0" />
                        <span>{action.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          /* ---- Rendered messages ---- */
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-1">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {isStreaming && messages[messages.length - 1]?.role === "user" && (
              <div className="flex items-start gap-3 py-3">
                <div
                  className={cn(
                    "flex items-center justify-center flex-shrink-0",
                    "w-8 h-8 rounded-xl",
                    "bg-gradient-to-br from-phantom-bgCard to-phantom-bgSecondary",
                    "border border-phantom-border"
                  )}
                >
                  <Ghost size={16} className="text-phantom-textSecondary" />
                </div>
                <div
                  className={cn(
                    "px-4 py-3",
                    "rounded-2xl rounded-tl-md",
                    "bg-phantom-bgCard border border-phantom-border"
                  )}
                >
                  <TypingIndicator />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/*  Input area                                                        */}
      {/* ================================================================= */}
      <div className="flex-shrink-0 border-t border-phantom-border bg-phantom-bg/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div
            className={cn(
              "flex items-end gap-3",
              "rounded-2xl border border-phantom-border",
              "bg-phantom-bgCard",
              "px-4 py-3",
              "focus-within:border-phantom-borderHover",
              "shadow-sm shadow-black/5",
              "transition-all duration-200"
            )}
          >
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Phantom anything..."
              rows={1}
              disabled={isStreaming}
              className={cn(
                "flex-1 bg-transparent border-none outline-none resize-none",
                "text-sm leading-relaxed text-phantom-text",
                "placeholder:text-phantom-textMuted",
                "disabled:opacity-50",
                "min-h-[24px] max-h-[160px]",
                "py-0.5"
              )}
            />

            {isStreaming ? (
              <button
                onClick={stopStreaming}
                className={cn(
                  "flex items-center justify-center flex-shrink-0",
                  "w-8 h-8 rounded-lg",
                  "bg-phantom-danger/10 text-phantom-danger",
                  "hover:bg-phantom-danger/20",
                  "transition-all duration-200",
                  "active:scale-95"
                )}
                aria-label="Stop generating"
              >
                <StopCircle size={16} />
              </button>
            ) : (
              <button
                onClick={() => sendMessage(inputValue)}
                disabled={!inputValue.trim()}
                className={cn(
                  "flex items-center justify-center flex-shrink-0",
                  "w-8 h-8 rounded-lg",
                  "transition-all duration-200",
                  inputValue.trim()
                    ? "bg-phantom-text text-phantom-bg hover:opacity-90 active:scale-95"
                    : "bg-transparent text-phantom-textMuted cursor-not-allowed"
                )}
                aria-label="Send message"
              >
                <Send size={15} />
              </button>
            )}
          </div>

          <p className="text-center mt-2.5 text-[10px] text-phantom-textMuted/60">
            Phantom AI can make mistakes. Verify important academic information.
          </p>
        </div>
      </div>
    </div>
  );
}
