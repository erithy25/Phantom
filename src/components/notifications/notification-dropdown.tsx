"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  AlertTriangle,
  FileEdit,
  Sparkles,
  Headphones,
  Users,
  CheckCheck,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import { useNotificationStore } from "@/store";
import type { Notification, NotificationType } from "@/types";

/* -------------------------------------------------------------------------- */
/*  Type Config                                                                */
/* -------------------------------------------------------------------------- */

const TYPE_ICON: Record<string, React.ElementType> = {
  ALERT: AlertTriangle,
  DRAFT: FileEdit,
  INSIGHT: Sparkles,
  LECTURE: Headphones,
  SOCIAL: Users,
};

const TYPE_COLOR: Record<string, string> = {
  ALERT: "text-phantom-danger",
  DRAFT: "text-phantom-success",
  INSIGHT: "text-phantom-textTertiary",
  LECTURE: "text-phantom-textSecondary",
  SOCIAL: "text-phantom-textMuted",
};

/* -------------------------------------------------------------------------- */
/*  Compact Notification Item                                                  */
/* -------------------------------------------------------------------------- */

function CompactNotificationItem({
  notification,
  onRead,
  onClick,
}: {
  notification: Notification;
  onRead: (id: string) => void;
  onClick: () => void;
}) {
  const router = useRouter();
  const Icon = TYPE_ICON[notification.type] || Bell;
  const color = TYPE_COLOR[notification.type] || "text-phantom-textMuted";

  const handleClick = () => {
    if (!notification.isRead) {
      onRead(notification.id);
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full flex items-start gap-2.5 px-3 py-2.5 text-left",
        "rounded-md transition-colors duration-150",
        "hover:bg-phantom-bgInput",
        !notification.isRead && "bg-phantom-accentBg"
      )}
    >
      <div
        className={cn(
          "w-7 h-7 rounded-md shrink-0",
          "bg-phantom-accentBg border border-phantom-border",
          "flex items-center justify-center"
        )}
      >
        <Icon className={cn("w-3 h-3", color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-[12px] leading-snug truncate",
            notification.isRead
              ? "text-phantom-textSecondary"
              : "text-phantom-text font-medium"
          )}
        >
          {notification.title}
        </p>
        <p className="text-[11px] text-phantom-textTertiary truncate mt-0.5">
          {notification.message}
        </p>
        <span className="text-[10px] font-mono text-phantom-textMuted">
          {formatRelativeTime(notification.createdAt)}
        </span>
      </div>
      {!notification.isRead && (
        <div className="w-1.5 h-1.5 rounded-full bg-phantom-text shrink-0 mt-2" />
      )}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Dropdown Component                                                         */
/* -------------------------------------------------------------------------- */

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const { unreadCount, setUnreadCount, clearUnread, decrementUnread } =
    useNotificationStore();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Fetch on open
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        const items: Notification[] = data.notifications || [];
        setNotifications(items);
        setUnreadCount(items.filter((n) => !n.isRead).length);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen, setUnreadCount]);

  // Mark single read
  const handleRead = useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/notifications/${id}`, { method: "PUT" });
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        decrementUnread();
      } catch {
        // silent
      }
    },
    [decrementUnread]
  );

  // Mark all read
  const handleMarkAllRead = useCallback(async () => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "read-all" }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      clearUnread();
    } catch {
      // silent
    }
  }, [clearUnread]);

  // Show last 10 in dropdown
  const recentNotifications = notifications.slice(0, 10);

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
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

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute right-0 top-full mt-1.5 z-50",
              "w-[380px] max-h-[400px]",
              "rounded-lg border border-phantom-border",
              "bg-phantom-bgCard shadow-phantom-lg",
              "flex flex-col overflow-hidden"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-phantom-border shrink-0">
              <div className="flex items-center gap-2">
                <h3 className="text-card-title text-phantom-text">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span
                    className={cn(
                      "min-w-[18px] h-[18px] px-1",
                      "flex items-center justify-center",
                      "rounded-full bg-phantom-accentBg",
                      "text-[10px] font-mono font-medium text-phantom-textSecondary"
                    )}
                  >
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-caption text-phantom-textTertiary hover:text-phantom-text flex items-center gap-1 transition-colors"
                >
                  <CheckCheck className="w-3 h-3" />
                  Read all
                </button>
              )}
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto p-1">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-phantom-accentBg animate-shimmer" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-3/4 bg-phantom-accentBg rounded animate-shimmer" />
                        <div className="h-2.5 w-1/2 bg-phantom-accentBg rounded animate-shimmer" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Bell className="w-6 h-6 text-phantom-textMuted mb-2" />
                  <p className="text-caption text-phantom-textTertiary">
                    No notifications yet
                  </p>
                </div>
              ) : (
                recentNotifications.map((notification) => (
                  <CompactNotificationItem
                    key={notification.id}
                    notification={notification}
                    onRead={handleRead}
                    onClick={() => setIsOpen(false)}
                  />
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t border-phantom-border px-4 py-2.5 shrink-0">
                <Link
                  href="/notifications"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-1.5 text-caption text-phantom-textTertiary hover:text-phantom-text transition-colors"
                >
                  View all notifications
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
