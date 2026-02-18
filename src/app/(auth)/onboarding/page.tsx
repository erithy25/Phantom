"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { profileSetupSchema } from "@/lib/validations";

// ─── Types ──────────────────────────────────────────────

type ProfileFormData = z.infer<typeof profileSetupSchema>;

interface DetectedCourse {
  id: string;
  name: string;
  code: string;
  professorName: string | null;
  credits: number;
  enabled: boolean;
}

type LmsType = "canvas" | "moodle" | "blackboard";

const LMS_CARDS: { type: LmsType; label: string; description: string }[] = [
  {
    type: "canvas",
    label: "Canvas",
    description: "Most popular LMS across US universities",
  },
  {
    type: "moodle",
    label: "Moodle",
    description: "Open-source learning platform",
  },
  {
    type: "blackboard",
    label: "Blackboard",
    description: "Enterprise learning management",
  },
];

// ─── Password strength ─────────────────────────────────

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score: 1, label: "Weak", color: "bg-phantom-danger" };
  if (score <= 4) return { score: 2, label: "Fair", color: "bg-phantom-warning" };
  return { score: 3, label: "Strong", color: "bg-phantom-success" };
}

// ─── Steps ──────────────────────────────────────────────

const TOTAL_STEPS = 3;

function OnboardingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const { update: updateSession } = useSession();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 state: Profile setup
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2 state: LMS connection
  const [selectedLms, setSelectedLms] = useState<LmsType | null>(null);
  const [lmsConnecting, setLmsConnecting] = useState(false);
  const [lmsConnected, setLmsConnected] = useState(false);

  // Step 3 state: Course confirmation
  const [courses, setCourses] = useState<DetectedCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);

  // Launch animation state
  const [showLaunchAnimation, setShowLaunchAnimation] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: {
      name: "",
      password: "",
    },
  });

  const passwordValue = watch("password");
  const passwordStrength = getPasswordStrength(passwordValue || "");

  // Handle photo selection
  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Photo must be under 5MB.");
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    setError(null);
  }

  // Step 1: Submit profile
  async function onProfileSubmit(data: ProfileFormData) {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("name", data.name);
      formData.append("password", data.password);
      if (photoFile) {
        formData.append("photo", photoFile);
      }

      const res = await fetch("/api/auth/setup-profile", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Failed to set up profile.");
        return;
      }

      setStep(2);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // Step 2: Connect LMS
  const handleLmsConnect = useCallback(
    async (lmsType: LmsType) => {
      setSelectedLms(lmsType);
      setLmsConnecting(true);
      setError(null);

      try {
        const res = await fetch("/api/lms/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, lmsType }),
        });

        const result = await res.json();

        if (!res.ok) {
          setError(result.error || "Failed to connect to LMS.");
          setLmsConnecting(false);
          return;
        }

        setLmsConnected(true);
        setLmsConnecting(false);

        // Auto-advance to step 3 after brief delay
        setTimeout(() => setStep(3), 800);
      } catch {
        setError("Failed to connect. Please try again.");
        setLmsConnecting(false);
      }
    },
    [email]
  );

  // Skip LMS connection
  function handleSkipLms() {
    setStep(3);
  }

  // Step 3: Fetch courses
  useEffect(() => {
    if (step !== 3) return;

    async function fetchCourses() {
      setCoursesLoading(true);

      try {
        const res = await fetch(
          `/api/lms/courses?email=${encodeURIComponent(email)}`
        );

        if (res.ok) {
          const data = await res.json();
          const mapped = (data.courses || []).map(
            (c: Omit<DetectedCourse, "enabled">) => ({
              ...c,
              enabled: true,
            })
          );
          setCourses(mapped);
        }
      } catch {
        // No courses detected, that's fine
      } finally {
        setCoursesLoading(false);
      }
    }

    fetchCourses();
  }, [step, email]);

  // Toggle course
  function toggleCourse(courseId: string) {
    setCourses((prev) =>
      prev.map((c) => (c.id === courseId ? { ...c, enabled: !c.enabled } : c))
    );
  }

  // Final: Launch Phantom
  async function handleLaunch() {
    setIsLoading(true);
    setError(null);

    try {
      const enabledCourses = courses
        .filter((c) => c.enabled)
        .map((c) => c.id);

      const res = await fetch("/api/auth/complete-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, courseIds: enabledCourses }),
      });

      if (!res.ok) {
        const result = await res.json();
        setError(result.error || "Failed to complete onboarding.");
        return;
      }

      // Show launch animation
      setShowLaunchAnimation(true);

      // Update session to reflect onboarding completion
      await updateSession({ onboardingDone: true });

      // Navigate after animation
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 2000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // ─── Launch animation overlay ─────────────────────────

  if (showLaunchAnimation) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center">
        <div className="animate-spring-in text-center">
          <h1 className="font-sans text-[42px] font-extrabold uppercase tracking-[0.2em] text-phantom-text">
            PHANTOM
          </h1>
          <p className="mt-4 text-[15px] italic text-phantom-textTertiary">
            Your ghost is alive.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-300 ${
              i + 1 <= step
                ? "w-8 bg-phantom-text"
                : "w-4 bg-phantom-border"
            }`}
          />
        ))}
      </div>

      {/* Step 1: Profile Setup */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-section-heading text-phantom-text">
              Set up your profile
            </h2>
            <p className="mt-2 text-body text-phantom-textTertiary">
              Tell us a bit about yourself
            </p>
          </div>

          {/* Photo upload */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-phantom-border transition-colors hover:border-phantom-borderHover"
            >
              {photoPreview ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={photoPreview}
                  alt="Profile preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-phantom-textMuted transition-colors group-hover:text-phantom-textTertiary"
                >
                  <path
                    d="M12 5v14M5 12h14"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </button>
          </div>
          <p className="text-center text-caption text-phantom-textMuted">
            Optional photo
          </p>

          <form
            onSubmit={handleSubmit(onProfileSubmit)}
            className="space-y-4"
          >
            {error && (
              <div className="rounded-lg border border-phantom-danger/30 bg-phantom-danger/10 px-4 py-3 text-body text-phantom-danger">
                {error}
              </div>
            )}

            {/* Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className="block font-mono text-label-mono uppercase text-phantom-textTertiary"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Your name"
                disabled={isLoading}
                className="h-[48px] w-full rounded-[12px] border border-phantom-border bg-phantom-bgInput px-4 text-body text-phantom-text placeholder:text-phantom-textMuted focus:border-phantom-borderHover focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-caption text-phantom-danger">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block font-mono text-label-mono uppercase text-phantom-textTertiary"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="Create a strong password"
                disabled={isLoading}
                className="h-[48px] w-full rounded-[12px] border border-phantom-border bg-phantom-bgInput px-4 text-body text-phantom-text placeholder:text-phantom-textMuted focus:border-phantom-borderHover focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-caption text-phantom-danger">
                  {errors.password.message}
                </p>
              )}

              {/* Password strength indicator */}
              {passwordValue && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          level <= passwordStrength.score
                            ? passwordStrength.color
                            : "bg-phantom-border"
                        }`}
                      />
                    ))}
                  </div>
                  <p
                    className={`text-caption ${
                      passwordStrength.score === 1
                        ? "text-phantom-danger"
                        : passwordStrength.score === 2
                          ? "text-phantom-warning"
                          : "text-phantom-success"
                    }`}
                  >
                    {passwordStrength.label}
                  </p>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex h-[48px] w-full items-center justify-center rounded-[12px] bg-white text-[14px] font-semibold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Setting up...
                </span>
              ) : (
                "Continue"
              )}
            </button>
          </form>
        </div>
      )}

      {/* Step 2: University Connection */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-section-heading text-phantom-text">
              Connect your university
            </h2>
            <p className="mt-2 text-body text-phantom-textTertiary">
              Link your LMS to auto-import courses and assignments
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-phantom-danger/30 bg-phantom-danger/10 px-4 py-3 text-body text-phantom-danger">
              {error}
            </div>
          )}

          {/* LMS Cards */}
          <div className="space-y-3">
            {LMS_CARDS.map((lms) => {
              const isSelected = selectedLms === lms.type;
              const isConnectedToThis = isSelected && lmsConnected;

              return (
                <button
                  key={lms.type}
                  onClick={() => handleLmsConnect(lms.type)}
                  disabled={lmsConnecting || lmsConnected}
                  className={`flex w-full items-center gap-4 rounded-[12px] border p-4 text-left transition-all ${
                    isConnectedToThis
                      ? "border-phantom-success/50 bg-phantom-success/5"
                      : isSelected && lmsConnecting
                        ? "border-phantom-borderHover bg-phantom-bgSecondary"
                        : "border-phantom-border bg-phantom-bgCard hover:border-phantom-borderHover hover:bg-phantom-bgCardHover"
                  } disabled:cursor-not-allowed`}
                >
                  {/* LMS Icon */}
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      isConnectedToThis
                        ? "bg-phantom-success/10"
                        : "bg-phantom-bgTertiary"
                    }`}
                  >
                    {isConnectedToThis ? (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        className="text-phantom-success"
                      >
                        <path
                          d="M5 10l3.5 3.5L15 7"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : lmsConnecting && isSelected ? (
                      <svg
                        className="h-5 w-5 animate-spin text-phantom-textMuted"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                    ) : (
                      <span className="text-[14px] font-bold text-phantom-textSecondary">
                        {lms.label[0]}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <p className="text-card-title text-phantom-text">
                      {lms.label}
                    </p>
                    <p className="text-caption text-phantom-textTertiary">
                      {isConnectedToThis
                        ? "Connected"
                        : lmsConnecting && isSelected
                          ? "Connecting..."
                          : lms.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Skip button */}
          <button
            onClick={handleSkipLms}
            disabled={lmsConnecting}
            className="w-full text-center text-body text-phantom-textTertiary transition-colors hover:text-phantom-textSecondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Skip for now
          </button>
        </div>
      )}

      {/* Step 3: Course Confirmation */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-section-heading text-phantom-text">
              Your courses
            </h2>
            <p className="mt-2 text-body text-phantom-textTertiary">
              {courses.length > 0
                ? "Toggle the courses you want Phantom to track"
                : "No courses detected yet. You can add them later."}
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-phantom-danger/30 bg-phantom-danger/10 px-4 py-3 text-body text-phantom-danger">
              {error}
            </div>
          )}

          {/* Loading state */}
          {coursesLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-[12px] border border-phantom-border bg-phantom-bgCard skeleton-shimmer"
                />
              ))}
            </div>
          )}

          {/* Course list */}
          {!coursesLoading && courses.length > 0 && (
            <div className="stagger-children space-y-3">
              {courses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => toggleCourse(course.id)}
                  className={`flex w-full items-center gap-4 rounded-[12px] border p-4 text-left transition-all ${
                    course.enabled
                      ? "border-phantom-borderHover bg-phantom-bgSecondary"
                      : "border-phantom-border bg-phantom-bgCard opacity-60"
                  }`}
                >
                  {/* Toggle indicator */}
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all ${
                      course.enabled
                        ? "border-phantom-text bg-phantom-text"
                        : "border-phantom-border bg-transparent"
                    }`}
                  >
                    {course.enabled && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <path
                          d="M2.5 6l2.5 2.5 4.5-5"
                          stroke="#09090B"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>

                  {/* Course info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-card-title text-phantom-text">
                      {course.name}
                    </p>
                    <p className="text-caption text-phantom-textTertiary">
                      {course.code}
                      {course.professorName && ` \u00b7 ${course.professorName}`}
                      {` \u00b7 ${course.credits} credits`}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Launch button */}
          <button
            onClick={handleLaunch}
            disabled={isLoading}
            className="flex h-[48px] w-full items-center justify-center rounded-[12px] bg-white text-[14px] font-semibold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Launching...
              </span>
            ) : (
              "Launch Phantom"
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="animate-fade-in" />}>
      <OnboardingPageContent />
    </Suspense>
  );
}
