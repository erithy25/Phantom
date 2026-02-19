"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AiInsightBannerProps {
  insight?: string;
}

const CHAR_DELAY = 25;

export function AiInsightBanner({ insight: insightProp }: AiInsightBannerProps) {
  const [fullText, setFullText] = useState(insightProp ?? "");
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const indexRef = useRef(0);

  // Fetch fresh insight from AI on each page load
  useEffect(() => {
    if (insightProp) {
      setFullText(insightProp);
      return;
    }

    async function fetchInsight() {
      try {
        const res = await fetch("/api/dashboard/insight");
        if (res.ok) {
          const data = await res.json();
          if (data.insight) {
            setFullText(data.insight);
            return;
          }
        }
      } catch {
        // silently fail
      }
      setFullText("Welcome to Phantom! Add your courses and tasks to get personalized AI insights here.");
    }

    fetchInsight();
  }, [insightProp]);

  // Start typing animation once fullText is ready
  useEffect(() => {
    if (!fullText || isComplete) return;

    indexRef.current = 0;
    setDisplayedText("");
    setIsTyping(true);

    intervalRef.current = setInterval(() => {
      indexRef.current += 1;
      setDisplayedText(fullText.slice(0, indexRef.current));

      if (indexRef.current >= fullText.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsTyping(false);
        setIsComplete(true);
      }
    }, CHAR_DELAY);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fullText]); // eslint-disable-line react-hooks/exhaustive-deps

  const skipAnimation = useCallback(() => {
    if (isComplete) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setDisplayedText(fullText);
    setIsTyping(false);
    setIsComplete(true);
  }, [isComplete, fullText]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: 0.15 }}
    >
      <div
        className={cn(
          "rounded-lg border border-phantom-border bg-phantom-bgCard p-5",
          "cursor-pointer select-none",
          "transition-all duration-200 ease-out",
          "hover:border-phantom-borderHover"
        )}
        onClick={skipAnimation}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") skipAnimation();
        }}
      >
        <div className="flex items-start gap-4">
          {/* Sparkle icon */}
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
              "bg-phantom-accentBg"
            )}
          >
            <Sparkles className="h-4 w-4 text-phantom-textSecondary" />
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1 space-y-2">
            <span className="block font-mono text-label-mono uppercase tracking-[0.05em] text-phantom-textTertiary">
              Phantom Insight
            </span>
            <p className="text-body text-phantom-textSecondary leading-relaxed">
              {displayedText}
              {isTyping && (
                <span className="ml-0.5 inline-block h-[14px] w-[2px] translate-y-[2px] animate-pulse-dot bg-phantom-textSecondary" />
              )}
            </p>
            {!isComplete && (
              <span className="block text-micro text-phantom-textMuted">
                Click to skip
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
