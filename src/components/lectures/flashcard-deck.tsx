"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Flashcard } from "@/types";

/* -------------------------------------------------------------------------- */
/*  Flashcard Component                                                        */
/* -------------------------------------------------------------------------- */

interface FlashcardProps {
  flashcard: Flashcard;
  isFlipped: boolean;
  onFlip: () => void;
}

function FlashcardItem({ flashcard, isFlipped, onFlip }: FlashcardProps) {
  return (
    <div
      className="relative w-full cursor-pointer"
      style={{ perspective: "1200px" }}
      onClick={onFlip}
    >
      <motion.div
        className="relative w-full"
        style={{
          transformStyle: "preserve-3d",
        }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* Front - Question */}
        <div
          className={cn(
            "w-full min-h-[240px] p-6 rounded-lg",
            "border border-phantom-border",
            "bg-phantom-bgCard",
            "flex flex-col items-center justify-center text-center",
            "select-none"
          )}
          style={{ backfaceVisibility: "hidden" }}
        >
          <span className="text-label-mono text-phantom-textMuted mb-3 uppercase">
            Question
          </span>
          <p className="text-[15px] font-medium text-phantom-text leading-relaxed">
            {flashcard.question}
          </p>
          {flashcard.difficulty && (
            <span
              className={cn(
                "mt-4 px-2 py-0.5 rounded-full text-[10px] font-mono",
                "border",
                flashcard.difficulty === "HARD"
                  ? "border-phantom-danger/20 text-phantom-danger bg-phantom-danger/10"
                  : flashcard.difficulty === "MEDIUM"
                    ? "border-phantom-warning/20 text-phantom-warning bg-phantom-warning/10"
                    : "border-phantom-border text-phantom-textMuted bg-phantom-accentBg"
              )}
            >
              {flashcard.difficulty}
            </span>
          )}
          <span className="absolute bottom-3 text-micro text-phantom-textMuted">
            Tap to reveal
          </span>
        </div>

        {/* Back - Answer */}
        <div
          className={cn(
            "absolute inset-0 w-full min-h-[240px] p-6 rounded-lg",
            "border border-phantom-borderHover",
            "bg-phantom-bgCardHover",
            "flex flex-col items-center justify-center text-center",
            "select-none"
          )}
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <span className="text-label-mono text-phantom-textMuted mb-3 uppercase">
            Answer
          </span>
          <p className="text-[15px] text-phantom-textSecondary leading-relaxed">
            {flashcard.answer}
          </p>
          <span className="absolute bottom-3 text-micro text-phantom-textMuted">
            Tap to flip back
          </span>
        </div>
      </motion.div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Deck Component                                                             */
/* -------------------------------------------------------------------------- */

interface FlashcardDeckProps {
  flashcards: Flashcard[];
}

export function FlashcardDeck({ flashcards }: FlashcardDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState(0);

  const total = flashcards.length;
  const current = flashcards[currentIndex];

  const goNext = useCallback(() => {
    if (currentIndex < total - 1) {
      setIsFlipped(false);
      setDirection(1);
      setTimeout(() => setCurrentIndex((i) => i + 1), 50);
    }
  }, [currentIndex, total]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setDirection(-1);
      setTimeout(() => setCurrentIndex((i) => i - 1), 50);
    }
  }, [currentIndex]);

  const reset = useCallback(() => {
    setIsFlipped(false);
    setDirection(-1);
    setTimeout(() => setCurrentIndex(0), 50);
  }, []);

  if (!current) {
    return (
      <div className="py-12 text-center">
        <p className="text-body text-phantom-textSecondary">
          No flashcards available.
        </p>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / total) * 100;

  return (
    <div className="max-w-lg mx-auto">
      {/* Progress */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-label-mono text-phantom-textMuted uppercase">
          Card {currentIndex + 1} of {total}
        </span>
        <button
          onClick={reset}
          className="text-caption text-phantom-textTertiary hover:text-phantom-text flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      {/* Progress Bar */}
      <div className="relative h-[3px] w-full bg-phantom-accentBg rounded-full mb-6 overflow-hidden">
        <motion.div
          className="h-full bg-phantom-text/70 rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: direction * 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -40 }}
          transition={{ duration: 0.2 }}
        >
          <FlashcardItem
            flashcard={current}
            isFlipped={isFlipped}
            onFlip={() => setIsFlipped(!isFlipped)}
          />
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-sm",
            "text-body font-medium transition-all duration-200",
            "border border-phantom-border",
            currentIndex === 0
              ? "text-phantom-textMuted/40 cursor-not-allowed"
              : "text-phantom-textSecondary hover:text-phantom-text hover:border-phantom-borderHover"
          )}
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        {/* Dot indicators */}
        <div className="flex items-center gap-1">
          {flashcards.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setIsFlipped(false);
                setDirection(i > currentIndex ? 1 : -1);
                setTimeout(() => setCurrentIndex(i), 50);
              }}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all duration-200",
                i === currentIndex
                  ? "bg-phantom-text w-4"
                  : i < currentIndex
                    ? "bg-phantom-textTertiary"
                    : "bg-phantom-border"
              )}
            />
          ))}
        </div>

        <button
          onClick={goNext}
          disabled={currentIndex === total - 1}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-sm",
            "text-body font-medium transition-all duration-200",
            "border border-phantom-border",
            currentIndex === total - 1
              ? "text-phantom-textMuted/40 cursor-not-allowed"
              : "text-phantom-textSecondary hover:text-phantom-text hover:border-phantom-borderHover"
          )}
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
