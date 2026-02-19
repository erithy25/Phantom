"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { z } from "zod";
import { forgotPasswordSchema } from "@/lib/validations";

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: ForgotPasswordFormData) {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email.toLowerCase() }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Something went wrong. Please try again.");
        return;
      }

      setSubmittedEmail(data.email);
      setIsSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // Success state
  if (isSubmitted) {
    return (
      <div className="animate-fade-in space-y-8">
        <div className="text-center">
          <h1 className="font-sans text-[28px] font-extrabold uppercase tracking-[0.2em] text-phantom-text">
            PHANTOM
          </h1>
        </div>

        <div className="space-y-4 text-center">
          {/* Success icon */}
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
            Check your email
          </h2>
          <p className="text-body text-phantom-textTertiary">
            If an account exists for{" "}
            <span className="text-phantom-textSecondary">
              {submittedEmail}
            </span>
            , we&apos;ve sent password reset instructions.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/login"
            className="flex h-[48px] w-full items-center justify-center rounded-[12px] border border-phantom-border text-[14px] font-medium text-phantom-text transition-colors hover:border-phantom-borderHover hover:bg-phantom-bgSecondary"
          >
            Back to login
          </Link>
        </div>
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
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            placeholder="you@example.com"
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
              Sending...
            </span>
          ) : (
            "Send Reset Link"
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
