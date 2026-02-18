"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Animated counter hook                                                      */
/* -------------------------------------------------------------------------- */

function useAnimatedCounter(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const easeOut = useCallback((t: number) => 1 - Math.pow(1 - t, 3), []);

  useEffect(() => {
    if (target === 0) {
      setValue(0);
      return;
    }

    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOut(progress);

      setValue(Math.round(easedProgress * target));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setValue(target);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration, easeOut]);

  return value;
}

/* -------------------------------------------------------------------------- */
/*  Campus pulse banner                                                        */
/* -------------------------------------------------------------------------- */

interface CampusPulseBannerProps {
  activeUsers?: number;
  universityName?: string;
}

export function CampusPulseBanner({
  activeUsers = 142,
  universityName = "your university",
}: CampusPulseBannerProps) {
  const count = useAnimatedCounter(activeUsers, 1200);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: 0.5 }}
    >
      <div
        className={cn(
          "rounded-lg border border-phantom-border bg-phantom-bgCard",
          "px-5 py-4",
          "transition-all duration-200 ease-out",
          "hover:border-phantom-borderHover"
        )}
      >
        <div className="flex items-center justify-between">
          {/* Left content */}
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                "bg-phantom-accentBg"
              )}
            >
              <Users className="h-4 w-4 text-phantom-textSecondary" />
            </div>

            {/* Text */}
            <div className="flex items-center gap-2">
              <span className="text-body font-medium text-phantom-textSecondary">
                Campus Pulse
              </span>
              <span className="text-phantom-textMuted">&middot;</span>
              <span className="text-body text-phantom-textTertiary">
                <span className="font-mono font-medium tabular-nums text-phantom-text">
                  {count}
                </span>{" "}
                students using Phantom at {universityName} right now
              </span>
            </div>
          </div>

          {/* Live badge */}
          <div className="flex shrink-0 items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1",
                "border border-phantom-success/20 bg-phantom-success/10"
              )}
            >
              {/* Pulsing green dot */}
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-phantom-success opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-phantom-success" />
              </span>
              <span className="font-mono text-[11px] font-medium text-phantom-success">
                Live
              </span>
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
