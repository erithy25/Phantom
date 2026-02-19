"use client";

import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { registerSchema } from "@/lib/validations";
import { lookupUniversity } from "@/lib/universities";

type RegisterFormData = z.infer<typeof registerSchema>;

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillEmail = searchParams.get("email") || "";

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [universityName, setUniversityName] = useState<string | null>(null);
  const [studentCount, setStudentCount] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: prefillEmail,
      password: "",
    },
  });

  const emailValue = watch("email");
  const passwordValue = watch("password");

  // Auto-detect university from email
  useEffect(() => {
    if (emailValue && emailValue.includes("@")) {
      const uni = lookupUniversity(emailValue);
      if (uni) {
        setUniversityName(uni.name);
        fetchStudentCount(uni.domain);
      } else {
        setUniversityName(null);
        setStudentCount(null);
      }
    } else {
      setUniversityName(null);
      setStudentCount(null);
    }
  }, [emailValue]);

  async function fetchStudentCount(domain: string) {
    try {
      const res = await fetch(
        `/api/campus/student-count?domain=${encodeURIComponent(domain)}`
      );
      if (res.ok) {
        const data = await res.json();
        setStudentCount(data.count ?? null);
      }
    } catch {
      // Non-critical, silently fail
    }
  }

  // Password strength calculation
  function getPasswordStrength(): { level: number; label: string; color: string } {
    if (!passwordValue) return { level: 0, label: "", color: "" };

    let score = 0;
    if (passwordValue.length >= 8) score++;
    if (/[A-Z]/.test(passwordValue)) score++;
    if (/[0-9]/.test(passwordValue)) score++;
    if (/[^A-Za-z0-9]/.test(passwordValue)) score++;

    if (score <= 1) return { level: 1, label: "Weak", color: "bg-phantom-danger" };
    if (score === 2) return { level: 2, label: "Fair", color: "bg-yellow-500" };
    if (score === 3) return { level: 3, label: "Good", color: "bg-blue-500" };
    return { level: 4, label: "Strong", color: "bg-phantom-success" };
  }

  const strength = getPasswordStrength();

  async function onSubmit(data: RegisterFormData) {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email.toLowerCase(),
          password: data.password,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Something went wrong. Please try again.");
        return;
      }

      // Store password temporarily for auto-login after verification
      sessionStorage.setItem("_phantom_reg_pw", data.password);

      // Navigate to verify page with email
      router.push(`/verify?email=${encodeURIComponent(data.email.toLowerCase())}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center">
      {/* Wordmark with breathing animation */}
      <div className="animate-breathing text-center">
        <h1 className="font-sans text-[42px] font-extrabold uppercase tracking-[0.2em] text-phantom-text">
          PHANTOM
        </h1>
      </div>

      {/* Tagline */}
      <p className="mt-3 text-center text-[15px] italic text-phantom-textTertiary">
        Because showing up is optional.
      </p>

      {/* Registration form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-10 w-full max-w-sm animate-fade-in space-y-4"
      >
        {/* Error */}
        {error && (
          <div className="rounded-lg border border-phantom-danger/30 bg-phantom-danger/10 px-4 py-3 text-body text-phantom-danger">
            {error}
          </div>
        )}

        {/* Email input */}
        <div>
          <div className="relative">
            <input
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              disabled={isLoading}
              className="h-[48px] w-full rounded-[12px] border border-phantom-border bg-phantom-bgInput pl-4 pr-4 text-body text-phantom-text placeholder:text-phantom-textMuted focus:border-phantom-borderHover focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="mt-1.5 text-caption text-phantom-danger">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password input */}
        <div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Create a password"
              disabled={isLoading}
              className="h-[48px] w-full rounded-[12px] border border-phantom-border bg-phantom-bgInput pl-4 pr-12 text-body text-phantom-text placeholder:text-phantom-textMuted focus:border-phantom-borderHover focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-phantom-textMuted transition-colors hover:text-phantom-text"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-caption text-phantom-danger">
              {errors.password.message}
            </p>
          )}

          {/* Password strength indicator */}
          {passwordValue && (
            <div className="mt-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i <= strength.level ? strength.color : "bg-phantom-border"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-1 text-[11px] text-phantom-textMuted">
                {strength.label}
              </p>
            </div>
          )}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading}
          className="flex h-[48px] w-full items-center justify-center rounded-[12px] bg-white font-medium text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <svg
              className="h-5 w-5 animate-spin"
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
            "Create Account"
          )}
        </button>
      </form>

      {/* Already have an account */}
      <p className="mt-6 text-center text-body text-phantom-textTertiary">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-phantom-text transition-colors hover:text-white"
        >
          Log in
        </Link>
      </p>

      {/* Student counter */}
      {universityName && studentCount !== null && studentCount > 0 && (
        <div className="mt-12 animate-fade-in text-center text-caption text-phantom-textMuted">
          Join{" "}
          <span className="text-phantom-textSecondary">
            {studentCount.toLocaleString()}
          </span>{" "}
          students already using Phantom at{" "}
          <span className="text-phantom-textSecondary">{universityName}</span>
        </div>
      )}

      {universityName && studentCount === null && (
        <div className="mt-12 animate-fade-in text-center text-caption text-phantom-textMuted">
          Be the first Phantom at{" "}
          <span className="text-phantom-textSecondary">{universityName}</span>
        </div>
      )}
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="animate-fade-in" />}>
      <RegisterPageContent />
    </Suspense>
  );
}
