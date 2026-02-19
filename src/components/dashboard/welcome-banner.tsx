"use client";

import { motion } from "framer-motion";
import { getGreeting } from "@/lib/utils";

interface WelcomeBannerProps {
  userName?: string | null;
}

export function WelcomeBanner({ userName }: WelcomeBannerProps) {
  const greeting = getGreeting(userName);

  return (
    <div className="space-y-1">
      <motion.h1
        className="text-page-title text-phantom-text"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {greeting}
      </motion.h1>
      <motion.p
        className="text-[14px] leading-relaxed text-phantom-textTertiary"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
      >
        Here&apos;s your overview for today.
      </motion.p>
    </div>
  );
}
