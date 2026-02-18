"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Ghost } from "lucide-react";
import { cn } from "@/lib/utils";
import { RichContentCard } from "@/components/chat/rich-content-card";
import type { ChatMessage } from "@/types";

/* -------------------------------------------------------------------------- */
/*  Simple markdown renderer                                                   */
/* -------------------------------------------------------------------------- */

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  let codeBlock = false;
  let codeContent = "";
  let codeLang = "";

  const flushList = () => {
    if (listBuffer.length > 0) {
      elements.push(
        <ul
          key={`list-${elements.length}`}
          className="list-disc list-inside space-y-0.5 my-1.5 text-[13px] leading-[1.7]"
        >
          {listBuffer.map((item, i) => (
            <li key={i} className="text-phantom-text">
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
      listBuffer = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    /* Code block toggle */
    if (line.startsWith("```")) {
      if (codeBlock) {
        flushList();
        elements.push(
          <pre
            key={`code-${i}`}
            className={cn(
              "my-2 p-3 rounded-md overflow-x-auto",
              "bg-phantom-bgSecondary border border-phantom-border",
              "font-mono text-[12px] leading-[1.6] text-phantom-textSecondary"
            )}
          >
            <code>{codeContent.trim()}</code>
          </pre>
        );
        codeBlock = false;
        codeContent = "";
        codeLang = "";
      } else {
        flushList();
        codeBlock = true;
        codeLang = line.slice(3).trim();
      }
      continue;
    }

    if (codeBlock) {
      codeContent += line + "\n";
      continue;
    }

    /* Headings */
    if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h4
          key={`h3-${i}`}
          className="text-[13px] font-semibold text-phantom-text mt-3 mb-1"
        >
          {renderInline(line.slice(4))}
        </h4>
      );
      continue;
    }
    if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h3
          key={`h2-${i}`}
          className="text-[14px] font-semibold text-phantom-text mt-3 mb-1"
        >
          {renderInline(line.slice(3))}
        </h3>
      );
      continue;
    }
    if (line.startsWith("# ")) {
      flushList();
      elements.push(
        <h2
          key={`h1-${i}`}
          className="text-[15px] font-bold text-phantom-text mt-3 mb-1"
        >
          {renderInline(line.slice(2))}
        </h2>
      );
      continue;
    }

    /* Unordered lists */
    if (/^[-*]\s/.test(line)) {
      listBuffer.push(line.replace(/^[-*]\s/, ""));
      continue;
    }

    /* Ordered lists */
    if (/^\d+\.\s/.test(line)) {
      listBuffer.push(line.replace(/^\d+\.\s/, ""));
      continue;
    }

    /* Empty line */
    if (line.trim() === "") {
      flushList();
      continue;
    }

    /* Paragraph */
    flushList();
    elements.push(
      <p
        key={`p-${i}`}
        className="text-[13px] leading-[1.7] text-phantom-text my-0.5"
      >
        {renderInline(line)}
      </p>
    );
  }

  flushList();
  return elements;
}

/* ---- Inline formatting (bold, italic, code, links) ---- */
function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  /* Pattern: **bold**, *italic*, `code`, [text](url) */
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|(\[(.+?)\]\((.+?)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[1]) {
      /* Bold */
      parts.push(
        <strong key={match.index} className="font-semibold">
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      /* Italic */
      parts.push(
        <em key={match.index} className="italic">
          {match[4]}
        </em>
      );
    } else if (match[5]) {
      /* Inline code */
      parts.push(
        <code
          key={match.index}
          className="px-1 py-0.5 rounded bg-phantom-bgSecondary font-mono text-[12px] text-phantom-textSecondary"
        >
          {match[6]}
        </code>
      );
    } else if (match[7]) {
      /* Link */
      parts.push(
        <a
          key={match.index}
          href={match[9]}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 text-phantom-textSecondary hover:text-phantom-text transition-colors"
        >
          {match[8]}
        </a>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

/* -------------------------------------------------------------------------- */
/*  MessageBubble                                                              */
/* -------------------------------------------------------------------------- */

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble = memo(function MessageBubble({
  message,
}: MessageBubbleProps) {
  const isUser = message.role === "user";

  const renderedContent = useMemo(
    () => renderMarkdown(message.content),
    [message.content]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "flex gap-2.5 py-2",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* ---- Phantom avatar (left, for phantom messages) ---- */}
      {!isUser && (
        <div
          className={cn(
            "flex items-center justify-center flex-shrink-0 mt-0.5",
            "w-7 h-7 rounded-[6px]",
            "bg-black border border-phantom-border"
          )}
        >
          <Ghost size={14} className="text-white" />
        </div>
      )}

      {/* ---- Message bubble ---- */}
      <div
        className={cn(
          "max-w-[85%] md:max-w-[70%]",
          "px-3 py-2.5",
          "rounded-lg",
          isUser
            ? "bg-phantom-text/[0.08] text-phantom-text"
            : "bg-phantom-bgCard border border-phantom-border text-phantom-text"
        )}
      >
        <div className="space-y-0.5">{renderedContent}</div>

        {/* ---- Rich content card ---- */}
        {message.richContent && (
          <div className="mt-3">
            <RichContentCard richContent={message.richContent} />
          </div>
        )}

        {/* ---- Timestamp ---- */}
        <p
          className={cn(
            "mt-1.5 text-[10px] font-mono",
            isUser ? "text-phantom-textMuted text-right" : "text-phantom-textMuted"
          )}
        >
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </motion.div>
  );
});
