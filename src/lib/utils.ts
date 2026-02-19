import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(date);
}

export function getGreeting(name?: string | null): string {
  const hour = new Date().getHours();
  let greeting = "Good evening";
  if (hour < 12) greeting = "Good morning";
  else if (hour < 17) greeting = "Good afternoon";
  return name ? `${greeting}, ${name}` : greeting;
}

export function getLetterGrade(percentage: number): string {
  if (percentage >= 93) return "A";
  if (percentage >= 90) return "A-";
  if (percentage >= 87) return "B+";
  if (percentage >= 83) return "B";
  if (percentage >= 80) return "B-";
  if (percentage >= 77) return "C+";
  if (percentage >= 73) return "C";
  if (percentage >= 70) return "C-";
  if (percentage >= 67) return "D+";
  if (percentage >= 63) return "D";
  if (percentage >= 60) return "D-";
  return "F";
}

export function getGpaFromLetter(letter: string): number {
  const map: Record<string, number> = {
    "A": 4.0, "A-": 3.7,
    "B+": 3.3, "B": 3.0, "B-": 2.7,
    "C+": 2.3, "C": 2.0, "C-": 1.7,
    "D+": 1.3, "D": 1.0, "D-": 0.7,
    "F": 0.0,
  };
  return map[letter] ?? 0;
}

export function getGradeColor(grade: string | null): string {
  if (!grade) return "text-phantom-text";
  if (grade.startsWith("A")) return "text-phantom-success";
  if (grade.startsWith("B")) return "text-phantom-warning";
  return "text-phantom-text";
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case "HIGH": return "bg-phantom-danger";
    case "MEDIUM": return "bg-phantom-warning";
    default: return "bg-phantom-textMuted";
  }
}

export function isEduEmail(email: string): boolean {
  return email.includes("@");
}

export function getUniversityFromEmail(email: string): string | null {
  const domain = email.split("@")[1];
  if (!domain) return null;
  return domain;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hrs}h ${remainMins}m`;
  }
  return `${mins}m ${secs}s`;
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function calculateGpa(
  courses: { credits: number; gradePoints: number }[]
): number {
  const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);
  if (totalCredits === 0) return 0;
  const totalPoints = courses.reduce(
    (sum, c) => sum + c.credits * c.gradePoints,
    0
  );
  return Math.round((totalPoints / totalCredits) * 100) / 100;
}

export function absoluteUrl(path: string) {
  return `${process.env.NEXTAUTH_URL}${path}`;
}
