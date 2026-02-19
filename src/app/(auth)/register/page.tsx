"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { registerSchema } from "@/lib/validations";
import { lookupUniversity } from "@/lib/universities";

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [universityName, setUniversityName] = useState<string | null>(null);
  const [studentCount, setStudentCount] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
    },
  });

  const emailValue = watch("email");

  // Auto-detect university from email
  useEffect(() => {
    if (emailValue && emailValue.includes("@")) {
      const uni = lookupUniversity(emailValue);
      if (uni) {
        setUniversityName(uni.name);
        // Fetch student count for this university
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

  async function onSubmit(data: RegisterFormData) {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email.toLowerCase() }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Something went wrong. Please try again.");
        return;
      }

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

      {/* Email input form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-10 w-full max-w-sm animate-fade-in"
      >
        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg border border-phantom-danger/30 bg-phantom-danger/10 px-4 py-3 text-body text-phantom-danger">
            {error}
          </div>
        )}

        <div className="relative">
          <input
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            disabled={isLoading}
            className="h-[48px] w-full rounded-[12px] border border-phantom-border bg-phantom-bgInput pl-4 pr-12 text-body text-phantom-text placeholder:text-phantom-textMuted focus:border-phantom-borderHover focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            {...register("email")}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-[8px] bg-white text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Submit email"
          >
            {isLoading ? (
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
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3.333 8h9.334M8.667 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>

        {errors.email && (
          <p className="mt-2 text-caption text-phantom-danger">
            {errors.email.message}
          </p>
        )}
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
