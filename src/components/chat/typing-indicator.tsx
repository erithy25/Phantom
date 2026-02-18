"use client";

import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Typing Indicator                                                           */
/*  Three 6px dots with staggered scale animation (0->1->0, 1.4s infinite,    */
/*  each dot delayed by 0.2s). Uses the typing-dot keyframes from             */
/*  tailwind.config.ts.                                                        */
/* -------------------------------------------------------------------------- */

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 h-5 px-0.5" aria-label="Phantom is typing">
      {[1, 2, 3].map((dot) => (
        <span
          key={dot}
          className={cn(
            "block w-1.5 h-1.5 rounded-full",
            "bg-phantom-textMuted",
            dot === 1 && "animate-typing-dot-1",
            dot === 2 && "animate-typing-dot-2",
            dot === 3 && "animate-typing-dot-3"
          )}
        />
      ))}
    </div>
  );
}
