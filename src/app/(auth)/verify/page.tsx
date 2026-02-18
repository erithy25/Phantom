"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  Suspense,
  type KeyboardEvent,
  type ClipboardEvent,
  type ChangeEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds
const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION = 300; // 5 minutes in seconds

function VerifyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);
  const [canResend, setCanResend] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Resend countdown timer
  useEffect(() => {
    if (resendTimer <= 0) {
      setCanResend(true);
      return;
    }

    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [resendTimer]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutTimer <= 0) return;

    const interval = setInterval(() => {
      setLockoutTimer((prev) => {
        if (prev <= 1) {
          setFailedAttempts(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [lockoutTimer]);

  // Trigger shake animation
  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 300);
  }, []);

  // Submit verification code
  const submitCode = useCallback(
    async (fullCode: string) => {
      if (isLoading || lockoutTimer > 0) return;

      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code: fullCode }),
        });

        const result = await res.json();

        if (!res.ok) {
          const newAttempts = failedAttempts + 1;
          setFailedAttempts(newAttempts);

          if (newAttempts >= MAX_ATTEMPTS) {
            setLockoutTimer(LOCKOUT_DURATION);
            setError(
              `Too many failed attempts. Please wait ${formatTime(LOCKOUT_DURATION)} before trying again.`
            );
          } else {
            setError(
              result.error ||
                `Invalid code. ${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts !== 1 ? "s" : ""} remaining.`
            );
          }

          triggerShake();
          // Clear inputs and refocus first
          setCode(Array(CODE_LENGTH).fill(""));
          setTimeout(() => inputRefs.current[0]?.focus(), 350);
          return;
        }

        // Success - navigate to onboarding
        router.push(`/onboarding?email=${encodeURIComponent(email)}`);
      } catch {
        setError("Something went wrong. Please try again.");
        triggerShake();
      } finally {
        setIsLoading(false);
      }
    },
    [email, failedAttempts, isLoading, lockoutTimer, router, triggerShake]
  );

  // Handle individual input change
  function handleChange(index: number, e: ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;

    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError(null);

    // Auto-focus next input
    if (value && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (value && index === CODE_LENGTH - 1) {
      const fullCode = newCode.join("");
      if (fullCode.length === CODE_LENGTH) {
        submitCode(fullCode);
      }
    }
  }

  // Handle keyboard navigation
  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (!code[index] && index > 0) {
        // Move to previous input and clear it
        const newCode = [...code];
        newCode[index - 1] = "";
        setCode(newCode);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  // Handle paste
  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text/plain")
      .replace(/\D/g, "")
      .slice(0, CODE_LENGTH);

    if (pasted.length === 0) return;

    const newCode = [...code];
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i];
    }
    setCode(newCode);

    // Focus the next empty input or the last one
    const nextEmpty = newCode.findIndex((c) => !c);
    if (nextEmpty !== -1) {
      inputRefs.current[nextEmpty]?.focus();
    } else {
      inputRefs.current[CODE_LENGTH - 1]?.focus();
    }

    // Auto-submit if full code pasted
    if (pasted.length === CODE_LENGTH) {
      submitCode(pasted);
    }
  }

  // Handle resend
  async function handleResend() {
    if (!canResend || isResending) return;

    setIsResending(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSuccessMessage("A new code has been sent to your email.");
        setCanResend(false);
        setResendTimer(RESEND_COOLDOWN);
        setCode(Array(CODE_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
      } else {
        const result = await res.json();
        setError(result.error || "Failed to resend code.");
      }
    } catch {
      setError("Failed to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  const isLocked = lockoutTimer > 0;

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-sans text-[28px] font-extrabold uppercase tracking-[0.2em] text-phantom-text">
          PHANTOM
        </h1>
        <p className="mt-3 text-body text-phantom-textTertiary">
          Enter the 6-digit code sent to
        </p>
        <p className="mt-1 text-body font-medium text-phantom-textSecondary">
          {email}
        </p>
      </div>

      {/* Code inputs */}
      <div
        className={`flex items-center justify-center gap-3 ${shake ? "animate-shake" : ""}`}
      >
        {Array.from({ length: CODE_LENGTH }).map((_, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={code[index]}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={index === 0 ? handlePaste : undefined}
            disabled={isLoading || isLocked}
            autoComplete="one-time-code"
            className={`h-[44px] w-[44px] rounded-[12px] border text-center font-mono text-[18px] font-medium text-phantom-text focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
              code[index]
                ? "border-phantom-borderHover bg-phantom-bgSecondary"
                : "border-phantom-border bg-phantom-bgInput"
            } ${error ? "border-phantom-danger/50" : "focus:border-phantom-borderHover"}`}
          />
        ))}
      </div>

      {/* Error / Success messages */}
      {error && (
        <p className="text-center text-caption text-phantom-danger">{error}</p>
      )}
      {successMessage && (
        <p className="text-center text-caption text-phantom-success">
          {successMessage}
        </p>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2">
          <svg
            className="h-4 w-4 animate-spin text-phantom-textMuted"
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
          <span className="text-caption text-phantom-textMuted">
            Verifying...
          </span>
        </div>
      )}

      {/* Lockout notice */}
      {isLocked && (
        <p className="text-center text-caption text-phantom-warning">
          Locked for {formatTime(lockoutTimer)}
        </p>
      )}

      {/* Resend */}
      <div className="text-center">
        {canResend ? (
          <button
            onClick={handleResend}
            disabled={isResending || isLocked}
            className="text-body text-phantom-textSecondary transition-colors hover:text-phantom-text disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isResending ? "Sending..." : "Resend code"}
          </button>
        ) : (
          <p className="text-caption text-phantom-textMuted">
            Resend code in {formatTime(resendTimer)}
          </p>
        )}
      </div>

      {/* Back to register */}
      <p className="text-center text-caption text-phantom-textMuted">
        Wrong email?{" "}
        <Link
          href="/register"
          className="text-phantom-textSecondary transition-colors hover:text-phantom-text"
        >
          Go back
        </Link>
      </p>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="animate-fade-in" />}>
      <VerifyPageContent />
    </Suspense>
  );
}
