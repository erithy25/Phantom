"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Ghost } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#09090B] flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col items-center text-center max-w-md"
      >
        <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-8">
          <Ghost className="w-8 h-8 text-[#52525B]" />
        </div>

        <h1 className="text-[64px] font-extrabold tracking-tight text-white leading-none">
          404
        </h1>

        <p className="mt-4 text-[16px] text-[#A1A1AA]">
          This page vanished into thin air.
        </p>

        <p className="mt-2 text-[13px] text-[#52525B]">
          Even Phantom can&apos;t find what you&apos;re looking for.
        </p>

        <Link
          href="/"
          className="mt-10 inline-flex items-center gap-2 h-10 px-5 rounded-[10px] text-[14px] font-medium bg-white/[0.06] border border-white/[0.08] text-[#A1A1AA] hover:text-white hover:bg-white/[0.1] transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </motion.div>
    </div>
  );
}
