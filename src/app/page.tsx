"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  TrendingUp,
  BookOpen,
  Headphones,
  FileEdit,
  Brain,
  Check,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isEduEmail } from "@/lib/utils";
import { lookupUniversity } from "@/lib/universities";

/* -------------------------------------------------------
   HERO SECTION
------------------------------------------------------- */
function HeroSection() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [detectedUni, setDetectedUni] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Detect university from email as the user types
  useEffect(() => {
    if (email.includes("@")) {
      const uni = lookupUniversity(email);
      setDetectedUni(uni?.name || null);
    } else {
      setDetectedUni(null);
    }
  }, [email]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Enter your email to continue.");
      triggerShake();
      return;
    }

    if (!isEduEmail(email.trim().toLowerCase())) {
      setError("Please enter a valid email address.");
      triggerShake();
      return;
    }

    router.push(`/register?email=${encodeURIComponent(email.trim().toLowerCase())}`);
  }

  function triggerShake() {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  }

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6">
      {/* Subtle radial glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.03]"
          style={{
            background:
              "radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Wordmark */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-[clamp(40px,8vw,80px)] font-extrabold tracking-[0.2em] text-white animate-breathing select-none"
        style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}
      >
        PHANTOM
      </motion.h1>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        className="mt-4 text-[clamp(14px,2vw,18px)] italic font-light text-[#A1A1AA] tracking-wide"
      >
        Because showing up is optional.
      </motion.p>

      {/* Email Input */}
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
        className={cn(
          "relative mt-10 w-full max-w-[420px]",
          shake && "animate-shake"
        )}
      >
        <div
          className={cn(
            "relative flex items-center",
            "h-12 rounded-[12px]",
            "border bg-transparent",
            "transition-colors duration-200",
            error
              ? "border-phantom-danger"
              : isFocused
              ? "border-[#52525B]"
              : "border-[#27272A]"
          )}
        >
          <input
            ref={inputRef}
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError("");
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Enter your email"
            className={cn(
              "flex-1 h-full bg-transparent px-5",
              "text-[14px] text-white placeholder:text-[#52525B]",
              "font-sans outline-none",
              "rounded-[12px]"
            )}
            autoComplete="email"
            spellCheck={false}
          />
          <button
            type="submit"
            className={cn(
              "absolute right-2 w-8 h-8 flex items-center justify-center",
              "rounded-[8px] bg-white/5 hover:bg-white/10",
              "text-[#A1A1AA] hover:text-white",
              "transition-all duration-200"
            )}
            aria-label="Submit"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2.5 text-[12px] text-phantom-danger font-medium"
          >
            {error}
          </motion.p>
        )}
      </motion.form>

      {/* Social Proof */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.7 }}
        className="mt-5 text-[11px] font-mono text-[#71717A] tracking-wide"
      >
        Join 2,847 students already using Phantom
        {detectedUni && (
          <span className="text-[#A1A1AA]"> at {detectedUni}</span>
        )}
      </motion.p>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-5 h-8 rounded-full border border-[#27272A] flex items-start justify-center pt-1.5"
        >
          <div className="w-1 h-1.5 rounded-full bg-[#52525B]" />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* -------------------------------------------------------
   FEATURES SECTION
------------------------------------------------------- */
const features = [
  {
    icon: Sparkles,
    title: "Phantom AI",
    description:
      "Your personal academic AI. Ask questions, generate study plans, and get contextual help for every course.",
  },
  {
    icon: TrendingUp,
    title: "GPA Lab",
    description:
      "Run grade simulations, track your GPA trajectory, and see exactly what you need on each assignment.",
  },
  {
    icon: FileEdit,
    title: "Smart Drafts",
    description:
      "AI-powered essay drafts that match your professor's style. Confidence highlighting shows what's strong and what needs work.",
  },
  {
    icon: Headphones,
    title: "Lecture Capture",
    description:
      "Record or upload lectures. Get transcripts, summaries, flashcards, and exam questions auto-generated.",
  },
  {
    icon: BookOpen,
    title: "Course Intelligence",
    description:
      "Aggregate all your courses, assignments, and deadlines in one place. Never miss a due date again.",
  },
  {
    icon: Brain,
    title: "Campus Pulse",
    description:
      "See how Phantom students perform versus others. Anonymous, aggregated data shows the Phantom advantage.",
  },
];

function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-32 px-6">
      <div className="max-w-[1000px] mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="text-[11px] font-mono text-[#52525B] uppercase tracking-[0.2em]">
            What you get
          </span>
          <h2 className="mt-4 text-[clamp(24px,4vw,40px)] font-bold text-white tracking-tight">
            Everything you need to graduate.
            <br />
            <span className="text-[#52525B]">Nothing you don&apos;t.</span>
          </h2>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className={cn(
                  "group relative p-6 rounded-[12px]",
                  "border border-[#18181B] hover:border-[#27272A]",
                  "bg-[#111113] hover:bg-[#141416]",
                  "transition-all duration-300"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-[10px] flex items-center justify-center mb-4",
                    "bg-white/[0.04] border border-white/[0.06]",
                    "group-hover:bg-white/[0.06]",
                    "transition-colors duration-300"
                  )}
                >
                  <Icon className="w-5 h-5 text-[#A1A1AA] group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-[15px] font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-[13px] text-[#71717A] leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------
   PRICING SECTION
------------------------------------------------------- */
const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Get started with Phantom basics.",
    features: [
      { label: "Phantom AI (5 msgs/day)", included: true },
      { label: "GPA tracking", included: true },
      { label: "Task management", included: true },
      { label: "1 course", included: true },
      { label: "Smart Drafts", included: false },
      { label: "Lecture capture", included: false },
      { label: "Campus Pulse", included: false },
      { label: "Priority support", included: false },
    ],
    cta: "Get started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$4.99",
    period: "/mo",
    description: "Unlock the full Phantom experience.",
    features: [
      { label: "Phantom AI (unlimited)", included: true },
      { label: "GPA Lab + simulations", included: true },
      { label: "Task management", included: true },
      { label: "Unlimited courses", included: true },
      { label: "Smart Drafts (10/mo)", included: true },
      { label: "Lecture capture (5hrs/mo)", included: true },
      { label: "Campus Pulse", included: true },
      { label: "Priority support", included: false },
    ],
    cta: "Start free trial",
    highlighted: true,
  },
  {
    name: "Ghost",
    price: "$9.99",
    period: "/mo",
    description: "Maximum autonomy. Full stealth mode.",
    features: [
      { label: "Phantom AI (unlimited)", included: true },
      { label: "GPA Lab + simulations", included: true },
      { label: "Task management", included: true },
      { label: "Unlimited courses", included: true },
      { label: "Smart Drafts (unlimited)", included: true },
      { label: "Lecture capture (unlimited)", included: true },
      { label: "Campus Pulse + leaderboard", included: true },
      { label: "Priority support", included: true },
    ],
    cta: "Go Ghost",
    highlighted: false,
  },
];

function PricingSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-32 px-6">
      <div className="max-w-[1000px] mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="text-[11px] font-mono text-[#52525B] uppercase tracking-[0.2em]">
            Pricing
          </span>
          <h2 className="mt-4 text-[clamp(24px,4vw,40px)] font-bold text-white tracking-tight">
            Less than your daily coffee.
          </h2>
          <p className="mt-3 text-[14px] text-[#71717A] max-w-md mx-auto">
            Start free. Upgrade when you&apos;re ready. Cancel anytime.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={cn(
                "relative flex flex-col p-6 rounded-[12px] border",
                plan.highlighted
                  ? "border-[#27272A] bg-[#141416]"
                  : "border-[#18181B] bg-[#111113]"
              )}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 text-[10px] font-semibold font-mono uppercase tracking-wider bg-white text-black rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-[14px] font-semibold text-[#A1A1AA] uppercase tracking-wider">
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1 mt-3">
                  <span className="text-[40px] font-extrabold text-white tracking-tight leading-none">
                    {plan.price}
                  </span>
                  <span className="text-[13px] text-[#52525B] font-medium">
                    {plan.period}
                  </span>
                </div>
                <p className="mt-2 text-[13px] text-[#52525B]">
                  {plan.description}
                </p>
              </div>

              {/* Feature List */}
              <ul className="flex-1 flex flex-col gap-2.5 mb-6">
                {plan.features.map((feat) => (
                  <li key={feat.label} className="flex items-center gap-2.5">
                    {feat.included ? (
                      <Check className="w-3.5 h-3.5 text-[#A1A1AA] shrink-0" />
                    ) : (
                      <Minus className="w-3.5 h-3.5 text-[#27272A] shrink-0" />
                    )}
                    <span
                      className={cn(
                        "text-[13px]",
                        feat.included
                          ? "text-[#A1A1AA]"
                          : "text-[#3F3F46]"
                      )}
                    >
                      {feat.label}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                className={cn(
                  "w-full h-11 rounded-[10px] text-[13px] font-semibold",
                  "transition-all duration-200",
                  plan.highlighted
                    ? "bg-white text-black hover:opacity-90 active:scale-[0.98]"
                    : "bg-white/[0.04] text-[#A1A1AA] border border-[#27272A] hover:bg-white/[0.08] hover:text-white active:scale-[0.98]"
                )}
              >
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------
   FOOTER
------------------------------------------------------- */
function Footer() {
  return (
    <footer className="border-t border-[#18181B] py-16 px-6">
      <div className="max-w-[1000px] mx-auto">
        <div className="flex flex-col md:flex-row items-start justify-between gap-12">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <span className="text-[18px] font-bold tracking-[0.2em] text-white">
              PHANTOM
            </span>
            <p className="text-[12px] text-[#52525B] max-w-[240px]">
              The AI student agent that does the heavy lifting so you can focus on what matters.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-16">
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-mono text-[#52525B] uppercase tracking-[0.15em]">
                Product
              </span>
              <FooterLink href="#features">Features</FooterLink>
              <FooterLink href="#pricing">Pricing</FooterLink>
              <FooterLink href="/changelog">Changelog</FooterLink>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-mono text-[#52525B] uppercase tracking-[0.15em]">
                Company
              </span>
              <FooterLink href="/about">About</FooterLink>
              <FooterLink href="/privacy">Privacy</FooterLink>
              <FooterLink href="/terms">Terms</FooterLink>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-mono text-[#52525B] uppercase tracking-[0.15em]">
                Connect
              </span>
              <FooterLink href="https://twitter.com/phantom">Twitter</FooterLink>
              <FooterLink href="https://discord.gg/phantom">Discord</FooterLink>
              <FooterLink href="mailto:hello@phantom.edu">Email</FooterLink>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-6 border-t border-[#18181B] flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-[11px] text-[#3F3F46] font-mono">
            &copy; {new Date().getFullYear()} Phantom. All rights reserved.
          </span>
          <span className="text-[11px] text-[#3F3F46] font-mono">
            Built for students, by students.
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="text-[13px] text-[#52525B] hover:text-[#A1A1AA] transition-colors duration-200"
    >
      {children}
    </a>
  );
}

/* -------------------------------------------------------
   LANDING PAGE
------------------------------------------------------- */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090B] text-white overflow-x-hidden">
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <Footer />
    </div>
  );
}
