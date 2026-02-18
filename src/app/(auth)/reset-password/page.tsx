"use client";

import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { resetPasswordSchema } from "@/lib/validations";

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

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

function ResetPasswordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token,
      password: "",
    },
  });

  const passwordValue = watch("password");
  const passwordStrength = getPasswordStrength(passwordValue || "");

  async function onSubmit(data: ResetPasswordFormData) {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: data.token,
          password: data.password,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(
          result.error || "Failed to reset password. The link may have expired."
        );
        return;
      }

      setIsSuccess(true);

      // Redirect to login after a brief delay
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // No token provided
  if (!token) {
    return (
      <div className="animate-fade-in space-y-8">
        <div className="text-center">
          <h1 className="font-sans text-[28px] font-extrabold uppercase tracking-[0.2em] text-phantom-text">
            PHANTOM
          </h1>
        </div>

        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-phantom-danger/30 bg-phantom-danger/10">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="text-phantom-danger"
            >
              <path
                d="M12 9v4M12 17h.01"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="text-card-title text-phantom-text">
            Invalid reset link
          </h2>
          <p className="text-body text-phantom-textTertiary">
            This password reset link is missing or invalid. Please request a new
            one.
          </p>
          <Link
            href="/forgot-password"
            className="mt-4 flex h-[48px] w-full items-center justify-center rounded-[12px] bg-white text-[14px] font-semibold text-black transition-opacity hover:opacity-90"
          >
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="animate-fade-in space-y-8">
        <div className="text-center">
          <h1 className="font-sans text-[28px] font-extrabold uppercase tracking-[0.2em] text-phantom-text">
            PHANTOM
          </h1>
        </div>

        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-phantom-success/30 bg-phantom-success/10">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="text-phantom-success"
            >
              <path
                d="M5 13l4 4L19 7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="text-card-title text-phantom-text">
            Password updated
          </h2>
          <p className="text-body text-phantom-textTertiary">
            Your password has been reset successfully. Redirecting to login...
          </p>
        </div>

        <Link
          href="/login"
          className="flex h-[48px] w-full items-center justify-center rounded-[12px] border border-phantom-border text-[14px] font-medium text-phantom-text transition-colors hover:border-phantom-borderHover hover:bg-phantom-bgSecondary"
        >
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-sans text-[28px] font-extrabold uppercase tracking-[0.2em] text-phantom-text">
          PHANTOM
        </h1>
        <p className="mt-3 text-body text-phantom-textTertiary">
          Enter your new password.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Hidden token field */}
        <input type="hidden" {...register("token")} />

        {error && (
          <div className="rounded-lg border border-phantom-danger/30 bg-phantom-danger/10 px-4 py-3 text-body text-phantom-danger">
            {error}
          </div>
        )}

        {/* New password */}
        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="block font-mono text-label-mono uppercase text-phantom-textTertiary"
          >
            New Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Enter a new password"
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
              Resetting...
            </span>
          ) : (
            "Reset Password"
          )}
        </button>
      </form>

      {/* Back to login */}
      <p className="text-center text-body text-phantom-textTertiary">
        Remember your password?{" "}
        <Link
          href="/login"
          className="text-phantom-text transition-colors hover:text-white"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="animate-fade-in" />}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}
