"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  BookOpen,
  Sparkles,
  TrendingUp,
  CheckSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/phantom-ai", label: "AI", icon: Sparkles, newTab: true },
  { href: "/gpa", label: "GPA", icon: TrendingUp },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 md:hidden",
        "h-14 flex items-center justify-around",
        "bg-phantom-bgSecondary border-t border-phantom-border",
        "safe-area-bottom"
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {mobileNavItems.map((item) => {
        const isActive =
          pathname === item.href || pathname?.startsWith(item.href + "/");
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            {...(item.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className={cn(
              "relative flex flex-col items-center justify-center",
              "w-full h-full gap-0.5",
              "transition-colors duration-150",
              isActive
                ? "text-phantom-text"
                : "text-phantom-textMuted"
            )}
          >
            {/* Active top border accent */}
            {isActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-phantom-text" />
            )}

            <Icon
              className={cn(
                "w-5 h-5",
                isActive ? "fill-phantom-text/10" : ""
              )}
              strokeWidth={isActive ? 2 : 1.5}
            />
            <span className="text-[10px] font-medium leading-none">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
