"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  Sparkles,
  TrendingUp,
  CheckSquare,
  Headphones,
  FileEdit,
  Users,
  Settings,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/chat", label: "Phantom AI", icon: Sparkles },
  { href: "/gpa", label: "GPA Lab", icon: TrendingUp },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/lectures", label: "Lectures", icon: Headphones },
  { href: "/drafts", label: "Drafts", icon: FileEdit },
  { href: "/pulse", label: "Campus Pulse", icon: Users },
];

function PhantomGhostIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="36" height="36" rx="8" fill="currentColor" fillOpacity="0.1" />
      <path
        d="M18 8C13.03 8 9 12.03 9 17v8.5c0 .83.67 1.5 1.5 1.5s1-0.67 1-1.5v-1c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v1c0 .83.67 1.5 1.5 1.5s1-0.67 1-1.5v-1c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v1c0 .83.67 1.5 1.5 1.5s1-0.67 1-1.5v-1c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v1c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V17c0-4.97-4.03-9-9-9z"
        fill="currentColor"
        fillOpacity="0.9"
      />
      <circle cx="14.5" cy="16" r="1.5" fill="var(--phantom-bg)" />
      <circle cx="21.5" cy="16" r="1.5" fill="var(--phantom-bg)" />
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggle } = useSidebarStore();
  const { data: session } = useSession();

  const userName = session?.user?.name || session?.user?.email?.split("@")[0] || "User";
  const userEmail = session?.user?.email || "";
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 64 : 220 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-40",
        "bg-phantom-bgSecondary border-r border-phantom-border",
        "select-none"
      )}
    >
      {/* Brand */}
      <div className="flex items-center h-14 px-3 gap-3 shrink-0">
        <div className="flex items-center justify-center w-9 h-9 shrink-0">
          <PhantomGhostIcon className="w-9 h-9 text-phantom-text" />
        </div>
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="text-[13px] font-bold tracking-[0.2em] text-phantom-text whitespace-nowrap"
            >
              PHANTOM
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-0.5 px-2 py-3 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 h-10 rounded-sm px-2.5",
                "transition-colors duration-150",
                isActive
                  ? "bg-phantom-accentBg text-phantom-text"
                  : "text-phantom-textTertiary hover:bg-phantom-accentBg hover:text-phantom-text"
              )}
            >
              <Icon
                className={cn(
                  "w-[18px] h-[18px] shrink-0",
                  isActive
                    ? "text-phantom-text"
                    : "text-phantom-textTertiary group-hover:text-phantom-text"
                )}
                strokeWidth={isActive ? 2 : 1.5}
              />
              <AnimatePresence mode="wait">
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={{ duration: 0.12 }}
                    className="text-[13px] font-medium whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="flex flex-col gap-0.5 px-2 py-3 border-t border-phantom-border">
        {/* Settings */}
        <Link
          href="/settings"
          className={cn(
            "group flex items-center gap-3 h-10 rounded-sm px-2.5",
            "transition-colors duration-150",
            pathname === "/settings"
              ? "bg-phantom-accentBg text-phantom-text"
              : "text-phantom-textTertiary hover:bg-phantom-accentBg hover:text-phantom-text"
          )}
        >
          <Settings
            className="w-[18px] h-[18px] shrink-0"
            strokeWidth={pathname === "/settings" ? 2 : 1.5}
          />
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -4 }}
                transition={{ duration: 0.12 }}
                className="text-[13px] font-medium whitespace-nowrap"
              >
                Settings
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        {/* User */}
        <div className="flex items-center gap-3 h-10 px-2.5">
          <div className="w-7 h-7 rounded-full bg-phantom-accentBg border border-phantom-border flex items-center justify-center shrink-0">
            <span className="text-[11px] font-semibold text-phantom-text">{initials}</span>
          </div>
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -4 }}
                transition={{ duration: 0.12 }}
                className="flex flex-col min-w-0"
              >
                <span className="text-[12px] font-medium text-phantom-text truncate">
                  {userName}
                </span>
                <span className="text-[10px] text-phantom-textMuted truncate">
                  {userEmail}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={toggle}
          className={cn(
            "flex items-center justify-center h-8 rounded-sm",
            "text-phantom-textMuted hover:text-phantom-text hover:bg-phantom-accentBg",
            "transition-colors duration-150"
          )}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <PanelLeft className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>
      </div>
    </motion.aside>
  );
}
