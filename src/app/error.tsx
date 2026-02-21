"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#09090B] flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-red-500/[0.08] border border-red-500/[0.15] flex items-center justify-center mb-8">
          <AlertTriangle className="w-8 h-8 text-red-400/70" />
        </div>

        <h1 className="text-[28px] font-bold tracking-tight text-white">
          Something went wrong
        </h1>

        <p className="mt-3 text-[14px] text-[#A1A1AA] leading-relaxed">
          Phantom hit an unexpected error. This has been logged automatically.
        </p>

        {error.message && process.env.NODE_ENV === "development" && (
          <pre className="mt-4 w-full p-3 rounded-lg bg-[#141416] border border-[#27272A] text-[12px] text-[#71717A] font-mono text-left overflow-x-auto">
            {error.message}
          </pre>
        )}

        <div className="mt-8 flex items-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-[10px] text-[14px] font-medium bg-white text-black hover:opacity-90 active:scale-[0.98] transition-all duration-200"
          >
            <RotateCcw className="w-4 h-4" />
            Try again
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-2 h-10 px-5 rounded-[10px] text-[14px] font-medium bg-white/[0.06] border border-white/[0.08] text-[#A1A1AA] hover:text-white hover:bg-white/[0.1] transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
