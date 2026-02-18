"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  AlertTriangle,
  FileEdit,
  Sparkles,
  Headphones,
  Users,
  Check,
  CheckCheck,
  Inbox,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotificationStore } from "@/store";
import type { Notification, NotificationType } from "@/types";

/* -------------------------------------------------------------------------- */
/*  Type Config                                                                */
/* -------------------------------------------------------------------------- */

interface TypeConfig {
  icon: React.ElementType;
  accentClass: string;
  accentColor: string;
  label: string;
}

const TYPE_CONFIG: Record<NotificationType, TypeConfig> = {
  ALERT: {
    icon: AlertTriangle,
    accentClass: "border-l-phantom-danger",
    accentColor: "text-phantom-danger",
    label: "Alert",
  },
  DRAFT: {
    icon: FileEdit,
    accentClass: "border-l-phantom-success",
    accentColor: "text-phantom-success",
    label: "Draft",
  },
  INSIGHT: {
    icon: Sparkles,
    accentClass: "border-l-phantom-textTertiary",
    accentColor: "text-phantom-textTertiary",
    label: "Insight",
  },
  LECTURE: {
    icon: Headphones,
    accentClass: "border-l-phantom-textMuted",
    accentColor: "text-phantom-textSecondary",
    label: "Lecture",
  },
  SOCIAL: {
    icon: Users,
    accentClass: "border-l-phantom-border",
    accentColor: "text-phantom-textMuted",
    label: "Social",
  },
};

function getTypeConfig(type: string): TypeConfig {
  return (
    TYPE_CONFIG[type as NotificationType] || {
      icon: Bell,
      accentClass: "border-l-phantom-border",
      accentColor: "text-phantom-textMuted",
      label: type,
    }
  );
}

/* -------------------------------------------------------------------------- */
/*  Notification Card                                                          */
/* -------------------------------------------------------------------------- */

function NotificationCard({
  notification,
  onMarkRead,
  index,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  index: number;
}) {
  const router = useRouter();
  const config = getTypeConfig(notification.type);
  const Icon = config.icon;

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkRead(notification.id);
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
      layout
    >
      <div
        onClick={handleClick}
        className={cn(
          "group flex items-start gap-3 p-4 rounded-lg",
          "border border-phantom-border border-l-2",
          "bg-phantom-bgCard",
          "hover:border-phantom-borderHover hover:bg-phantom-bgCardHover",
          "transition-all duration-200 cursor-pointer",
          config.accentClass,
          !notification.isRead && "bg-phantom-accentBg"
        )}
      >
        {/* Icon */}
        <div
          className={cn(
            "w-8 h-8 rounded-lg shrink-0",
            "bg-phantom-accentBg border border-phantom-border",
            "flex items-center justify-center"
          )}
        >
          <Icon className={cn("w-3.5 h-3.5", config.accentColor)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p
              className={cn(
                "text-body leading-snug",
                notification.isRead
                  ? "text-phantom-textSecondary"
                  : "text-phantom-text font-medium"
              )}
            >
              {notification.title}
            </p>
            <span className="text-micro font-mono text-phantom-textMuted shrink-0 mt-0.5">
              {formatRelativeTime(notification.createdAt)}
            </span>
          </div>
          <p className="text-caption text-phantom-textTertiary mt-0.5 line-clamp-2">
            {notification.message}
          </p>
        </div>

        {/* Unread Indicator */}
        {!notification.isRead && (
          <div className="w-2 h-2 rounded-full bg-phantom-text shrink-0 mt-2" />
        )}
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Loading Skeleton                                                           */
/* -------------------------------------------------------------------------- */

function NotificationSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3 p-4 rounded-lg border border-phantom-border"
        >
          <Skeleton className="w-8 h-8 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

const ALL_TYPES: NotificationType[] = [
  "ALERT",
  "DRAFT",
  "INSIGHT",
  "LECTURE",
  "SOCIAL",
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<NotificationType | "ALL">("ALL");
  const { setUnreadCount, clearUnread, decrementUnread } =
    useNotificationStore();

  // Fetch notifications
  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          const items: Notification[] = data.notifications || [];
          setNotifications(items);
          setUnreadCount(items.filter((n) => !n.isRead).length);
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, [setUnreadCount]);

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
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  }, [clearUnread]);

  // Mark single read
  const handleMarkRead = useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/notifications/${id}`, { method: "PUT" });
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        decrementUnread();
      } catch (err) {
        console.error("Failed to mark notification read:", err);
      }
    },
    [decrementUnread]
  );

  // Filtered list
  const filteredNotifications =
    filterType === "ALL"
      ? notifications
      : notifications.filter((n) => n.type === filterType);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-page-title text-phantom-text mb-1">
            Notifications
          </h1>
          <p className="text-body text-phantom-textSecondary">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
              : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="default" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Type Filter Tabs */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterType("ALL")}
          className={cn(
            "px-3 py-1.5 rounded-md text-body font-medium whitespace-nowrap",
            "transition-colors duration-200",
            filterType === "ALL"
              ? "bg-phantom-accentBg text-phantom-text"
              : "text-phantom-textMuted hover:text-phantom-textSecondary"
          )}
        >
          All
        </button>
        {ALL_TYPES.map((type) => {
          const config = getTypeConfig(type);
          const count = notifications.filter((n) => n.type === type).length;
          return (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                "px-3 py-1.5 rounded-md text-body font-medium whitespace-nowrap",
                "flex items-center gap-1.5",
                "transition-colors duration-200",
                filterType === type
                  ? "bg-phantom-accentBg text-phantom-text"
                  : "text-phantom-textMuted hover:text-phantom-textSecondary"
              )}
            >
              {config.label}
              {count > 0 && (
                <span className="text-micro text-phantom-textMuted">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <NotificationSkeleton />
      ) : filteredNotifications.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn(
            "flex flex-col items-center justify-center py-20",
            "rounded-lg border border-dashed border-phantom-border"
          )}
        >
          <div className="w-12 h-12 rounded-full bg-phantom-accentBg flex items-center justify-center mb-4">
            <Inbox className="w-5 h-5 text-phantom-textMuted" />
          </div>
          <p className="text-body text-phantom-textSecondary mb-1">
            {filterType === "ALL"
              ? "No notifications yet"
              : `No ${getTypeConfig(filterType).label.toLowerCase()} notifications`}
          </p>
          <p className="text-caption text-phantom-textMuted">
            Phantom will keep you posted on important updates.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filteredNotifications.map((notification, i) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkRead={handleMarkRead}
                index={i}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
