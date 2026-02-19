"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useSidebarStore } from "@/store";
import { cn } from "@/lib/utils";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isCollapsed } = useSidebarStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
  }, [status, session, router]);

  // Loading state
  if (status === "loading" || !mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-phantom-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-phantom-border border-t-phantom-text animate-spin" />
          <span className="text-label-mono font-mono text-phantom-textMuted uppercase tracking-wider">
            Loading
          </span>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-phantom-bg">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <motion.div
        initial={false}
        animate={{
          marginLeft: mounted ? (isCollapsed ? 64 : 220) : 220,
        }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className={cn(
          "flex-1 flex flex-col min-h-screen",
          "md:ml-0",
          "transition-[margin] duration-200 ease-out"
        )}
        style={{
          /* Fallback for SSR; motion handles the animation client-side */
        }}
      >
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 w-full">
          <div className="mx-auto max-w-[1200px] p-6">
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </div>
        </main>
      </motion.div>

      {/* Mobile Bottom Nav */}
      <MobileNav />
    </div>
  );
}
