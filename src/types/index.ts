import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      universityId?: string;
      onboardingDone?: boolean;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: string;
    universityId?: string;
    onboardingDone?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
    universityId?: string;
    onboardingDone?: boolean;
  }
}

// ============================================
// App Types
// ============================================

export interface PhantomUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: string;
  universityId: string | null;
  onboardingDone: boolean;
  createdAt: string;
}

export interface University {
  id: string;
  name: string;
  domain: string;
  lmsType: string | null;
  lmsUrl: string | null;
  studentCount: number;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  professorName: string | null;
  credits: number;
  semester: string | null;
  currentGrade: number | null;
  letterGrade: string | null;
  isActive: boolean;
  semesterProgress: number;
  assignments?: Assignment[];
  lectures?: Lecture[];
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  weight: number | null;
  maxScore: number | null;
  grade: number | null;
  status: AssignmentStatus;
  priority: Priority;
  estimatedTime: number | null;
  gpaImpact: number | null;
  course?: { name: string; code: string };
  drafts?: Draft[];
}

export type AssignmentStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "DRAFT_READY"
  | "SUBMITTED"
  | "GRADED";

export type Priority = "HIGH" | "MEDIUM" | "LOW";

export interface Draft {
  id: string;
  assignmentId: string;
  content: string;
  predictedGrade: string | null;
  confidenceAreas: ConfidenceArea[] | null;
  phantomNotes: PhantomNote[] | null;
  version: number;
  status: string;
  wordCount: number | null;
  createdAt: string;
}

export interface ConfidenceArea {
  start: number;
  end: number;
  note: string;
  confidence: "high" | "medium" | "low";
}

export interface PhantomNote {
  section: string;
  note: string;
}

export interface Lecture {
  id: string;
  courseId: string;
  title: string | null;
  date: string;
  audioUrl: string | null;
  transcript: string | null;
  summary: string | null;
  durationSeconds: number | null;
  topics: string[] | null;
  captureMethod: string | null;
  processingStatus: string;
  flashcards?: Flashcard[];
  examQuestions?: ExamQuestion[];
  course?: { name: string; code: string };
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  difficulty: string;
  lastReviewed: string | null;
  nextReview: string | null;
}

export interface ExamQuestion {
  id: string;
  question: string;
  answer: string | null;
  topic: string | null;
  confidence: number | null;
}

export interface Conversation {
  id: string;
  title: string | null;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "phantom";
  content: string;
  richContent?: RichContent | null;
  createdAt: string;
}

export interface RichContent {
  type: "draft" | "flashcards" | "study-plan" | "grade-simulation" | "calendar-event";
  data: Record<string, unknown>;
}

export interface GpaData {
  currentGpa: number;
  semesterGpa: number;
  totalCredits: number;
  courses: GpaCourseData[];
}

export interface GpaCourseData {
  id: string;
  name: string;
  code: string;
  credits: number;
  currentGrade: number | null;
  letterGrade: string | null;
  gpaPoints: number;
}

export interface GpaScenario {
  id: string;
  name: string;
  courseGrades: Record<string, string>;
  resultGpa: number;
  probability: number | null;
}

export interface GpaHistoryEntry {
  semester: string;
  gpa: number;
  credits: number;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl: string | null;
  createdAt: string;
}

export type NotificationType =
  | "ALERT"
  | "DRAFT"
  | "INSIGHT"
  | "LECTURE"
  | "SOCIAL";

export interface CampusPulseData {
  activeUsers: number;
  totalUsers: number;
  weeklyGrowth: number;
  universityName: string;
}

export interface CoursePulseData {
  courseId: string;
  phantomUsers: number;
  totalStudents: number;
  phantomPercentage: number;
  avgPhantomGrade: number | null;
  avgNonPhantomGrade: number | null;
  topActions: string[];
}

export interface UserSettings {
  theme: "dark" | "light";
  language: string;
  writingTone: "FORMAL" | "BALANCED" | "CASUAL";
  draftAutonomy: "CONSERVATIVE" | "BALANCED" | "AGGRESSIVE";
  gpaAdvisorLevel: "RELAXED" | "ACTIVE" | "INTENSE";
  notificationAlerts: boolean;
  notificationDrafts: boolean;
  notificationInsights: boolean;
  notificationLectures: boolean;
  notificationSocial: boolean;
  pushAlerts: boolean;
  pushDrafts: boolean;
  pushInsights: boolean;
  pushSocial: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  doNotDisturb: boolean;
  examMode: boolean;
  campusPulseOptIn: boolean;
  leaderboardOptIn: boolean;
  aiTrainingOptIn: boolean;
}

export interface DashboardStats {
  currentGpa: number;
  gpaTrend: number;
  semesterCredits: number;
  tasksDueThisWeek: number;
  draftsReady: number;
}

export interface ProfessorProfile {
  name: string;
  gradingTendencies: string[];
  averageGradeDistribution: Record<string, number>;
  emphasisTopics: string[];
  preferences: string[];
}
