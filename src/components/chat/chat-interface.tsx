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
import { Send, Ghost, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { MessageBubble } from "@/components/chat/message-bubble";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import type { ChatMessage, Conversation } from "@/types";

/* -------------------------------------------------------------------------- */
/*  Quick action pills                                                         */
/* -------------------------------------------------------------------------- */

const QUICK_ACTIONS = [
  "Write my ECON problem set",
  "Prepare me for the Chem midterm",
  "Review my Philosophy essay draft",
  "Optimize my GPA strategy",
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
  const [hasFirstMessage, setHasFirstMessage] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  /* ---- Determine if new conversation ---- */
  const isNewConversation = !conversationId && messages.length === 0;

  /* ---- Sync hasFirstMessage with message count ---- */
  useEffect(() => {
    if (messages.length > 0) {
      setHasFirstMessage(true);
    } else {
      setHasFirstMessage(false);
    }
  }, [messages]);

  /* ---- Auto-scroll on new messages ---- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  /* ---- Auto-resize textarea ---- */
  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [inputValue, resizeTextarea]);

  /* ---- Send message ---- */
  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isStreaming) return;

      setInputValue("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      /* Optimistic user message */
      const userMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);

      try {
        const res = await fetch("/api/chat/message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            message: trimmed,
          }),
        });

        if (!res.ok) throw new Error("Message failed");

        /* ---- Stream the response ---- */
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error("No reader");

        let phantomContent = "";
        const phantomMessageId = `phantom-${Date.now()}`;
        let receivedConversation: Conversation | null = null;

        /* Add empty phantom message for streaming */
        const phantomMessage: ChatMessage = {
          id: phantomMessageId,
          role: "phantom",
          content: "",
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, phantomMessage]);

        let done = false;
        while (!done) {
          const result = await reader.read();
          done = result.done;

          if (result.value) {
            const chunk = decoder.decode(result.value, { stream: true });
            const lines = chunk.split("\n").filter(Boolean);

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);

                if (data === "[DONE]") {
                  done = true;
                  break;
                }

                try {
                  const parsed = JSON.parse(data);

                  if (parsed.type === "conversation") {
                    receivedConversation = parsed.conversation;
                  } else if (parsed.type === "content") {
                    phantomContent += parsed.text;
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === phantomMessageId
                          ? { ...m, content: phantomContent }
                          : m
                      )
                    );
                  } else if (parsed.type === "rich_content") {
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === phantomMessageId
                          ? { ...m, richContent: parsed.richContent }
                          : m
                      )
                    );
                  }
                } catch {
                  /* skip non-JSON lines */
                  phantomContent += data;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === phantomMessageId
                        ? { ...m, content: phantomContent }
                        : m
                    )
                  );
                }
              }
            }
          }
        }

        if (receivedConversation) {
          onConversationUpdate(receivedConversation);
        }
      } catch {
        /* Add error message */
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: "phantom",
          content:
            "I ran into an issue processing your request. Please try again.",
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsStreaming(false);
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

  /* ---- Quick action handler ---- */
  const handleQuickAction = useCallback(
    (action: string) => {
      sendMessage(action);
    },
    [sendMessage]
  );

  return (
    <div className="flex flex-col h-full bg-phantom-bg">
      {/* ================================================================= */}
      {/*  Header                                                            */}
      {/* ================================================================= */}
      <div
        className={cn(
          "flex items-center gap-3 px-5 py-3",
          "border-b border-phantom-border",
          "bg-phantom-bg/80 backdrop-blur-sm",
          "flex-shrink-0"
        )}
      >
        {/* Phantom avatar */}
        <div
          className={cn(
            "flex items-center justify-center",
            "w-9 h-9 rounded-[8px]",
            "bg-black border border-phantom-border"
          )}
        >
          <Ghost size={18} className="text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-semibold text-phantom-text tracking-tight">
              Phantom AI
            </h2>
            <span
              className={cn(
                "inline-flex items-center gap-1",
                "px-1.5 py-0.5 rounded-full",
                "bg-phantom-success/10 border border-phantom-success/20",
                "text-phantom-success",
                "font-mono text-[10px] font-medium tracking-wide"
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-phantom-success animate-pulse-dot" />
              Active
            </span>
          </div>
          <p className="text-[11px] text-phantom-textMuted truncate">
            Knows your courses &middot; Real-time context &middot; Always
            learning
          </p>
        </div>
      </div>

      {/* ================================================================= */}
      {/*  Messages area                                                     */}
      {/* ================================================================= */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-1"
      >
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-[8px] bg-phantom-bgCard border border-phantom-border flex items-center justify-center">
                <Ghost size={20} className="text-phantom-textMuted animate-breathing" />
              </div>
              <p className="text-caption text-phantom-textMuted">
                Loading conversation...
              </p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          /* ---- Empty / New conversation state ---- */
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center gap-3"
            >
              <div
                className={cn(
                  "w-14 h-14 rounded-[12px]",
                  "bg-phantom-bgCard border border-phantom-border",
                  "flex items-center justify-center"
                )}
              >
                <Ghost size={28} className="text-phantom-textMuted" />
              </div>
              <div className="text-center">
                <h3 className="text-[17px] font-semibold text-phantom-text tracking-tight">
                  How can I help?
                </h3>
                <p className="text-caption text-phantom-textMuted mt-1">
                  Ask me anything about your courses, assignments, or study
                  plans.
                </p>
              </div>
            </motion.div>

            {/* Quick action pills */}
            <AnimatePresence>
              {isNewConversation && !hasFirstMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, delay: 0.15 }}
                  className="w-full max-w-lg"
                >
                  <div className="flex gap-2 overflow-x-auto pb-2 px-1 scrollbar-none">
                    {QUICK_ACTIONS.map((action, i) => (
                      <motion.button
                        key={action}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + i * 0.06 }}
                        onClick={() => handleQuickAction(action)}
                        className={cn(
                          "flex items-center gap-1.5",
                          "whitespace-nowrap",
                          "px-3 py-2 rounded-full",
                          "bg-phantom-bgCard border border-phantom-border",
                          "text-[12px] font-medium text-phantom-textSecondary",
                          "hover:border-phantom-borderHover hover:text-phantom-text",
                          "hover:bg-phantom-bgCardHover",
                          "transition-all duration-200",
                          "active:scale-[0.97]"
                        )}
                      >
                        <Sparkles size={12} className="text-phantom-textMuted flex-shrink-0" />
                        {action}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          /* ---- Rendered messages ---- */
          <>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {isStreaming && messages[messages.length - 1]?.role === "user" && (
              <div className="flex items-start gap-2.5 py-2">
                <div
                  className={cn(
                    "flex items-center justify-center flex-shrink-0",
                    "w-7 h-7 rounded-[6px]",
                    "bg-black border border-phantom-border"
                  )}
                >
                  <Ghost size={14} className="text-white" />
                </div>
                <div
                  className={cn(
                    "px-3 py-2.5",
                    "rounded-lg",
                    "bg-phantom-bgCard border border-phantom-border"
                  )}
                >
                  <TypingIndicator />
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ================================================================= */}
      {/*  Input area                                                        */}
      {/* ================================================================= */}
      <div className="flex-shrink-0 border-t border-phantom-border px-4 py-3 bg-phantom-bg">
        <div
          className={cn(
            "flex items-end gap-2",
            "rounded-lg border border-phantom-border",
            "bg-phantom-bgInput",
            "px-3 py-2",
            "focus-within:border-phantom-borderHover",
            "transition-colors duration-200"
          )}
        >
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Phantom..."
            rows={1}
            disabled={isStreaming}
            className={cn(
              "flex-1 bg-transparent border-none outline-none resize-none",
              "text-[13px] leading-[1.6] text-phantom-text",
              "placeholder:text-phantom-textMuted",
              "disabled:opacity-50",
              "min-h-[24px] max-h-[120px]",
              "py-0.5"
            )}
          />

          <button
            onClick={() => sendMessage(inputValue)}
            disabled={!inputValue.trim() || isStreaming}
            className={cn(
              "flex items-center justify-center flex-shrink-0",
              "w-8 h-8 rounded-md",
              "transition-all duration-200",
              inputValue.trim() && !isStreaming
                ? "bg-phantom-text text-phantom-bg hover:opacity-90 active:scale-95"
                : "bg-transparent text-phantom-textMuted cursor-not-allowed"
            )}
            aria-label="Send message"
          >
            <Send size={15} />
          </button>
        </div>

        <p className="text-center mt-2 text-[10px] text-phantom-textMuted">
          Phantom can make mistakes. Verify important academic information.
        </p>
      </div>
    </div>
  );
}
