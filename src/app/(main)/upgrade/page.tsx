"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, TrendingUp, Headphones, FileEdit, Users, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const proFeatures = [
  { icon: Sparkles, label: "Phantom AI", description: "Unlimited AI conversations for all your academic needs" },
  { icon: TrendingUp, label: "GPA Lab", description: "Grade simulations, trends, and AI-powered study advice" },
  { icon: FileEdit, label: "Smart Drafts", description: "AI essay drafts with confidence highlighting" },
  { icon: Headphones, label: "Lecture Capture", description: "Auto-transcription, summaries, and flashcard generation" },
  { icon: Users, label: "Campus Pulse", description: "See how you compare with anonymous campus analytics" },
  { icon: Zap, label: "Priority Support", description: "Get help faster when you need it" },
];

export default function UpgradePage() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleUpgrade() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
          return;
        }
      }
    } catch {
      // silently fail
    }
    setIsLoading(false);
  }

  return (
    <div className="max-w-[640px] mx-auto px-6 py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-10"
      >
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-phantom-accentBg mb-4">
          <Sparkles className="w-6 h-6 text-phantom-text" />
        </div>
        <h1 className="text-page-title text-phantom-text">
          Upgrade to Phantom Pro
        </h1>
        <p className="mt-2 text-body text-phantom-textTertiary">
          Unlock the full Phantom experience. One plan, everything included.
        </p>
      </motion.div>

      {/* Pricing Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className={cn(
          "rounded-lg border border-phantom-border bg-phantom-bgCard p-8",
          "transition-all duration-200"
        )}
      >
        {/* Price */}
        <div className="text-center mb-8">
          <div className="flex items-baseline justify-center gap-1.5">
            <span className="text-[48px] font-extrabold text-phantom-text tracking-tight leading-none">
              9,99&euro;
            </span>
            <span className="text-[14px] text-phantom-textMuted font-medium">
              /mo
            </span>
          </div>
          <p className="mt-2 text-[13px] text-phantom-textTertiary">
            Cancel anytime. No commitment.
          </p>
        </div>

        {/* Feature List */}
        <ul className="space-y-4 mb-8">
          {proFeatures.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <motion.li
                key={feat.label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.15 + i * 0.05 }}
                className="flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-md bg-phantom-accentBg flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-phantom-textSecondary" />
                </div>
                <div>
                  <span className="text-[14px] font-medium text-phantom-text block">
                    {feat.label}
                  </span>
                  <span className="text-[12px] text-phantom-textTertiary">
                    {feat.description}
                  </span>
                </div>
              </motion.li>
            );
          })}
        </ul>

        {/* CTA */}
        <button
          onClick={handleUpgrade}
          disabled={isLoading}
          className={cn(
            "w-full h-12 rounded-[10px] text-[14px] font-semibold",
            "bg-white text-black",
            "hover:opacity-90 active:scale-[0.98]",
            "transition-all duration-200",
            "flex items-center justify-center gap-2",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isLoading ? (
            <div className="w-5 h-5 rounded-full border-2 border-black/20 border-t-black animate-spin" />
          ) : (
            <>
              <Check className="w-4 h-4" />
              Subscribe to Phantom Pro
            </>
          )}
        </button>
      </motion.div>

      {/* Bottom note */}
      <p className="mt-6 text-center text-[12px] text-phantom-textMuted">
        Secure payment via Stripe. You can cancel anytime from Settings.
      </p>
    </div>
  );
}
