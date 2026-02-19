"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeStore, useNotificationStore, useSidebarStore } from "@/store";

const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/courses": "Courses",
  "/phantom-ai": "Phantom AI",
  "/gpa-lab": "GPA Lab",
  "/tasks": "Tasks",
  "/lectures": "Lectures",
  "/drafts": "Drafts",
  "/campus-pulse": "Campus Pulse",
  "/settings": "Settings",
};

function getCurrentDate(): string {
  const now = new Date();
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
}

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, toggleTheme } = useThemeStore();
  const { unreadCount } = useNotificationStore();
  const { isCollapsed } = useSidebarStore();

  const pageTitle =
    title ||
    routeTitles[pathname ?? ""] ||
    Object.entries(routeTitles).find(([path]) =>
      pathname?.startsWith(path + "/")
    )?.[1] ||
    "Phantom";

  const dateStr = getCurrentDate();
  const userName = session?.user?.name || "Student";
  const userRole = session?.user?.role || "FREE";
  const initials = (userName || "S")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "S";

  return (
    <header
      className={cn(
        "h-14 shrink-0 flex items-center justify-between px-6",
        "bg-phantom-bgSecondary border-b border-phantom-border",
        "sticky top-0 z-30"
      )}
    >
      {/* Left: Date */}
      <div className="flex items-center min-w-0">
        <span className="text-label-mono font-mono text-phantom-textTertiary uppercase">
          {dateStr}
        </span>
      </div>

      {/* Center: Page Title */}
      <div className="absolute left-1/2 -translate-x-1/2 hidden sm:block">
        <h1 className="text-[14px] font-semibold text-phantom-text tracking-tight">
          {pageTitle}
        </h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            "relative w-9 h-9 flex items-center justify-center",
            "rounded-sm border border-phantom-border",
            "text-phantom-textTertiary hover:text-phantom-text",
            "hover:border-phantom-borderHover",
            "transition-colors duration-200"
          )}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {theme === "dark" ? (
              <motion.div
                key="moon"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Moon className="w-4 h-4" />
              </motion.div>
            ) : (
              <motion.div
                key="sun"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Sun className="w-4 h-4" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Notification Bell */}
        <button
          className={cn(
            "relative w-9 h-9 flex items-center justify-center",
            "rounded-sm",
            "text-phantom-textTertiary hover:text-phantom-text",
            "hover:bg-phantom-accentBg",
            "transition-colors duration-200"
          )}
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className={cn(
                "absolute -top-0.5 -right-0.5",
                "min-w-[16px] h-4 px-1 flex items-center justify-center",
                "rounded-full bg-phantom-danger",
                "text-[9px] font-semibold text-white leading-none"
              )}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </motion.span>
          )}
        </button>

        {/* User Dropdown */}
        <div className="flex items-center gap-2.5 pl-2 ml-1 border-l border-phantom-border">
          <div className="w-7 h-7 rounded-full bg-phantom-accentBg border border-phantom-border flex items-center justify-center shrink-0">
            <span className="text-[10px] font-semibold text-phantom-text">
              {initials}
            </span>
          </div>
          <div className="hidden sm:flex flex-col min-w-0">
            <span className="text-[12px] font-medium text-phantom-text truncate leading-tight">
              {userName}
            </span>
            <span className="text-[10px] text-phantom-textMuted leading-tight capitalize">
              {userRole.toLowerCase()}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
