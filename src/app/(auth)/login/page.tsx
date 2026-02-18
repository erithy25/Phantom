"use client";

import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { loginSchema } from "@/lib/validations";
import { lookupUniversity } from "@/lib/universities";

type LoginFormData = z.infer<typeof loginSchema>;

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [universityName, setUniversityName] = useState<string | null>(null);
  const [activeUsers, setActiveUsers] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const emailValue = watch("email");

  // Detect university from email
  useEffect(() => {
    if (emailValue && emailValue.includes("@")) {
      const uni = lookupUniversity(emailValue);
      setUniversityName(uni?.name || null);
    } else {
      setUniversityName(null);
    }
  }, [emailValue]);

  // Fetch live campus user count
  useEffect(() => {
    let cancelled = false;

    async function fetchActiveUsers() {
      try {
        const res = await fetch("/api/campus/active-users");
        if (res.ok && !cancelled) {
          const data = await res.json();
          setActiveUsers(data.activeUsers ?? null);
        }
      } catch {
        // Silently fail - non-critical UI element
      }
    }

    fetchActiveUsers();
    const interval = setInterval(fetchActiveUsers, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  async function onSubmit(data: LoginFormData) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email: data.email.toLowerCase(),
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-8">
      {/* Wordmark */}
      <div className="text-center">
        <h1 className="font-sans text-[28px] font-extrabold uppercase tracking-[0.2em] text-phantom-text">
          PHANTOM
        </h1>
        {universityName && (
          <p className="mt-2 text-caption text-phantom-textTertiary">
            {universityName}
          </p>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Error banner */}
        {error && (
          <div className="rounded-lg border border-phantom-danger/30 bg-phantom-danger/10 px-4 py-3 text-body text-phantom-danger">
            {error}
          </div>
        )}

        {/* Email */}
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block font-mono text-label-mono uppercase text-phantom-textTertiary"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@university.edu"
            disabled={isLoading}
            className="h-[48px] w-full rounded-[12px] border border-phantom-border bg-phantom-bgInput px-4 text-body text-phantom-text placeholder:text-phantom-textMuted focus:border-phantom-borderHover focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-caption text-phantom-danger">
              {errors.email.message}
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
            autoComplete="current-password"
            placeholder="Enter your password"
            disabled={isLoading}
            className="h-[48px] w-full rounded-[12px] border border-phantom-border bg-phantom-bgInput px-4 text-body text-phantom-text placeholder:text-phantom-textMuted focus:border-phantom-borderHover focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-caption text-phantom-danger">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Forgot password */}
        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-caption text-phantom-textTertiary transition-colors hover:text-phantom-textSecondary"
          >
            Forgot password?
          </Link>
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
              Logging in...
            </span>
          ) : (
            "Log In"
          )}
        </button>
      </form>

      {/* Register link */}
      <p className="text-center text-body text-phantom-textTertiary">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="text-phantom-text transition-colors hover:text-white"
        >
          Sign up
        </Link>
      </p>

      {/* Live campus counter */}
      {activeUsers !== null && (
        <div className="flex items-center justify-center gap-2 pt-4 text-caption text-phantom-textMuted">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-phantom-success opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-phantom-success" />
          </span>
          <span>
            {activeUsers.toLocaleString()} student
            {activeUsers !== 1 ? "s" : ""} online now
          </span>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="animate-fade-in" />}>
      <LoginPageContent />
    </Suspense>
  );
}
