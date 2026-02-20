"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Ghost, Copy, Check } from "lucide-react";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";

/* -------------------------------------------------------------------------- */
/*  Simple markdown renderer                                                   */
/* -------------------------------------------------------------------------- */

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  let orderedListBuffer: string[] = [];
  let codeBlock = false;
  let codeContent = "";

  const flushList = () => {
    if (listBuffer.length > 0) {
      elements.push(
        <ul
          key={`list-${elements.length}`}
          className="list-disc list-inside space-y-1 my-2 text-sm leading-relaxed"
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
    if (orderedListBuffer.length > 0) {
      elements.push(
        <ol
          key={`olist-${elements.length}`}
          className="list-decimal list-inside space-y-1 my-2 text-sm leading-relaxed"
        >
          {orderedListBuffer.map((item, i) => (
            <li key={i} className="text-phantom-text">
              {renderInline(item)}
            </li>
          ))}
        </ol>
      );
      orderedListBuffer = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("```")) {
      if (codeBlock) {
        flushList();
        elements.push(
          <pre
            key={`code-${i}`}
            className={cn(
              "my-3 p-4 rounded-xl overflow-x-auto",
              "bg-black/30 border border-phantom-border",
              "font-mono text-[13px] leading-relaxed text-phantom-textSecondary"
            )}
          >
            <code>{codeContent.trim()}</code>
          </pre>
        );
        codeBlock = false;
        codeContent = "";
      } else {
        flushList();
        codeBlock = true;
      }
      continue;
    }

    if (codeBlock) {
      codeContent += line + "\n";
      continue;
    }

    if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h4
          key={`h3-${i}`}
          className="text-sm font-semibold text-phantom-text mt-4 mb-1.5"
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
          className="text-[15px] font-semibold text-phantom-text mt-4 mb-1.5"
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
          className="text-base font-bold text-phantom-text mt-4 mb-1.5"
        >
          {renderInline(line.slice(2))}
        </h2>
      );
      continue;
    }

    if (/^[-*]\s/.test(line)) {
      if (orderedListBuffer.length > 0) flushList();
      listBuffer.push(line.replace(/^[-*]\s/, ""));
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      if (listBuffer.length > 0) flushList();
      orderedListBuffer.push(line.replace(/^\d+\.\s/, ""));
      continue;
    }

    if (line.trim() === "") {
      flushList();
      continue;
    }

    flushList();
    elements.push(
      <p
        key={`p-${i}`}
        className="text-sm leading-relaxed text-phantom-text my-1"
      >
        {renderInline(line)}
      </p>
    );
  }

  flushList();
  return elements;
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|(\[(.+?)\]\((.+?)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[1]) {
      parts.push(
        <strong key={match.index} className="font-semibold">
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      parts.push(
        <em key={match.index} className="italic">
          {match[4]}
        </em>
      );
    } else if (match[5]) {
      parts.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 rounded-md bg-black/20 font-mono text-[13px] text-phantom-textSecondary"
        >
          {match[6]}
        </code>
      );
    } else if (match[7]) {
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
  const [copied, setCopied] = useState(false);

  const renderedContent = useMemo(
    () => renderMarkdown(message.content),
    [message.content]
  );

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [message.content]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "flex gap-3 py-3",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div
          className={cn(
            "flex items-center justify-center flex-shrink-0 mt-0.5",
            "w-8 h-8 rounded-xl",
            "bg-gradient-to-br from-phantom-bgCard to-phantom-bgSecondary",
            "border border-phantom-border"
          )}
        >
          <Ghost size={16} className="text-phantom-textSecondary" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[85%] md:max-w-[75%] group relative",
          isUser
            ? "bg-phantom-text/[0.08] rounded-2xl rounded-br-md px-4 py-3"
            : "bg-phantom-bgCard border border-phantom-border rounded-2xl rounded-tl-md px-4 py-3"
        )}
      >
        <div className="space-y-0.5">{renderedContent}</div>

        {/* Copy button for phantom messages */}
        {!isUser && message.content.length > 0 && (
          <button
            onClick={handleCopy}
            className={cn(
              "absolute -bottom-3 right-2",
              "flex items-center gap-1 px-2 py-1 rounded-lg",
              "bg-phantom-bgCard border border-phantom-border",
              "text-[10px] text-phantom-textMuted",
              "hover:text-phantom-text hover:border-phantom-borderHover",
              "opacity-0 group-hover:opacity-100",
              "transition-all duration-200",
              "shadow-sm"
            )}
          >
            {copied ? (
              <>
                <Check size={10} />
                Copied
              </>
            ) : (
              <>
                <Copy size={10} />
                Copy
              </>
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
});
