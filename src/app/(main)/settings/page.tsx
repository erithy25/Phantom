"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import {
  User,
  Palette,
  Bell,
  Sparkles,
  Shield,
  Sun,
  Moon,
  Save,
  Trash2,
  Download,
  Camera,
  Key,
  LogOut,
  ExternalLink,
  AlertTriangle,
  Crown,
  Ghost,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { useThemeStore } from "@/store";
import type { UserSettings } from "@/types";

/* -------------------------------------------------------------------------- */
/*  Tab Definitions                                                            */
/* -------------------------------------------------------------------------- */

const TABS = [
  { id: "account", label: "Account", icon: User },
  { id: "subscription", label: "Subscription", icon: Crown },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "ai", label: "AI Preferences", icon: Sparkles },
  { id: "privacy", label: "Privacy & Data", icon: Shield },
] as const;

type TabId = (typeof TABS)[number]["id"];

/* -------------------------------------------------------------------------- */
/*  Section Wrapper                                                            */
/* -------------------------------------------------------------------------- */

function SettingsSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <h3 className="text-[15px] font-semibold text-phantom-text">{title}</h3>
        {description && (
          <p className="text-sm text-phantom-textTertiary mt-0.5">
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Toggle Row                                                                 */
/* -------------------------------------------------------------------------- */

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 gap-4">
      <div className="min-w-0">
        <span className="text-sm text-phantom-textSecondary block">
          {label}
        </span>
        {description && (
          <span className="text-xs text-phantom-textMuted block mt-0.5">
            {description}
          </span>
        )}
      </div>
      <ToggleSwitch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Select Row                                                                 */
/* -------------------------------------------------------------------------- */

function SelectRow({
  label,
  description,
  value,
  options,
  onChange,
}: {
  label: string;
  description?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 gap-4">
      <div className="min-w-0">
        <span className="text-sm text-phantom-textSecondary block">
          {label}
        </span>
        {description && (
          <span className="text-xs text-phantom-textMuted block mt-0.5">
            {description}
          </span>
        )}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "bg-phantom-bgInput border border-phantom-border rounded-xl",
          "px-3 py-2 text-sm text-phantom-text",
          "focus:outline-none focus:border-phantom-borderHover",
          "cursor-pointer min-w-[160px]"
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Divider                                                                    */
/* -------------------------------------------------------------------------- */

function Divider() {
  return <div className="border-t border-phantom-border my-6" />;
}

/* -------------------------------------------------------------------------- */
/*  Delete Confirmation                                                        */
/* -------------------------------------------------------------------------- */

function DeleteConfirmation({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [confirmText, setConfirmText] = useState("");

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-full max-w-md p-6 rounded-2xl",
          "border border-phantom-border bg-phantom-bgCard",
          "shadow-2xl shadow-black/30"
        )}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-phantom-danger/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-phantom-danger" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-phantom-text">
              Delete Account
            </h3>
            <p className="text-xs text-phantom-textTertiary">
              This action cannot be undone.
            </p>
          </div>
        </div>

        <p className="text-sm text-phantom-textSecondary mb-4">
          All your data including courses, drafts, lecture transcripts, and
          AI conversations will be permanently deleted. Type{" "}
          <span className="font-mono text-phantom-danger font-medium">
            DELETE
          </span>{" "}
          to confirm.
        </p>

        <Input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder='Type "DELETE" to confirm'
          className="mb-4"
        />

        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={confirmText !== "DELETE"}
            onClick={onConfirm}
            className="bg-phantom-danger text-white hover:opacity-90"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Account
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function SettingsPage() {
  const { data: session } = useSession();
  const { theme, setTheme } = useThemeStore();
  const [activeTab, setActiveTab] = useState<TabId>("account");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [plan, setPlan] = useState<string>("FREE");

  const [settings, setSettings] = useState<UserSettings>({
    theme: "dark",
    language: "en",
    writingTone: "BALANCED",
    draftAutonomy: "BALANCED",
    gpaAdvisorLevel: "ACTIVE",
    notificationAlerts: true,
    notificationDrafts: true,
    notificationInsights: true,
    notificationLectures: true,
    notificationSocial: true,
    pushAlerts: true,
    pushDrafts: true,
    pushInsights: false,
    pushSocial: false,
    quietHoursStart: null,
    quietHoursEnd: null,
    doNotDisturb: false,
    examMode: false,
    campusPulseOptIn: true,
    leaderboardOptIn: false,
    aiTrainingOptIn: false,
  });

  const [name, setName] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Fetch settings + subscription
  useEffect(() => {
    async function fetchData() {
      try {
        const [settingsRes, subRes] = await Promise.all([
          fetch("/api/notifications/preferences"),
          fetch("/api/subscription", { cache: "no-store" }),
        ]);
        if (settingsRes.ok) {
          const data = await settingsRes.json();
          if (data.settings) {
            setSettings((prev) => ({ ...prev, ...data.settings }));
          }
        }
        if (subRes.ok) {
          const data = await subRes.json();
          setPlan(data.plan || "FREE");
        }
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setProfileImage(session.user.image || null);
    }
  }, [session]);

  const updateSetting = useCallback(
    <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const saveSettings = useCallback(async () => {
    setSaving(true);
    try {
      await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  }, [settings]);

  const handleExport = useCallback(async () => {
    try {
      const res = await fetch("/api/user/export");
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "phantom-data-export.json";
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Export failed:", err);
    }
  }, []);

  const handleDeleteAccount = useCallback(async () => {
    try {
      await fetch("/api/user", { method: "DELETE" });
      window.location.href = "/";
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }, []);

  const handlePhotoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => setProfileImage(reader.result as string);
      reader.readAsDataURL(file);
    },
    []
  );

  const handleLogout = useCallback(() => {
    signOut({ callbackUrl: "/" });
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-52 space-y-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded-xl" />
            ))}
          </div>
          <div className="flex-1 space-y-4">
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-phantom-text">Settings</h1>
          <p className="text-sm text-phantom-textMuted mt-0.5">
            Manage your account, preferences, and privacy.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={saveSettings}
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-phantom-bg/30 border-t-phantom-bg rounded-full animate-spin" />
                Saving...
              </>
            ) : saved ? (
              <>
                <Save className="w-3.5 h-3.5" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Tab Navigation */}
        <nav className="md:w-52 shrink-0">
          <div className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 md:sticky md:top-20">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-xl",
                  "text-sm whitespace-nowrap",
                  "transition-all duration-200",
                  activeTab === tab.id
                    ? "bg-phantom-bgCard border border-phantom-border text-phantom-text font-medium shadow-sm"
                    : "text-phantom-textTertiary hover:text-phantom-textSecondary hover:bg-phantom-bgCard/50 border border-transparent"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}

            <div className="border-t border-phantom-border my-2 hidden md:block" />

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-xl",
                "text-sm whitespace-nowrap",
                "text-phantom-danger/80 hover:text-phantom-danger",
                "hover:bg-phantom-danger/5 border border-transparent",
                "transition-all duration-200"
              )}
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>
        </nav>

        {/* Tab Content */}
        <div className="flex-1 min-w-0">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className={cn(
                "rounded-2xl border border-phantom-border",
                "bg-phantom-bgCard p-6"
              )}
            >
              {/* ---------------------------------------------------------- */}
              {/*  Account Tab                                                */}
              {/* ---------------------------------------------------------- */}
              {activeTab === "account" && (
                <div>
                  <SettingsSection title="Profile">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="relative">
                        <div
                          className={cn(
                            "w-16 h-16 rounded-2xl overflow-hidden",
                            "bg-phantom-accentBg border border-phantom-border",
                            "flex items-center justify-center"
                          )}
                        >
                          {profileImage ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={profileImage}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-6 h-6 text-phantom-textMuted" />
                          )}
                        </div>
                        <label
                          className={cn(
                            "absolute -bottom-1 -right-1",
                            "w-6 h-6 rounded-lg",
                            "bg-phantom-text text-phantom-bg",
                            "flex items-center justify-center cursor-pointer",
                            "hover:opacity-90 transition-opacity"
                          )}
                        >
                          <Camera className="w-3 h-3" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePhotoUpload}
                          />
                        </label>
                      </div>
                      <div>
                        <p className="text-sm text-phantom-text font-medium">
                          {name || "Student"}
                        </p>
                        <p className="text-xs text-phantom-textMuted">
                          {session?.user?.email}
                        </p>
                        {profileImage && (
                          <button
                            onClick={() => setProfileImage(null)}
                            className="text-xs text-phantom-danger hover:underline mt-1"
                          >
                            Remove photo
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-phantom-textMuted block mb-1.5 uppercase tracking-wider">
                          Name
                        </label>
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="max-w-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-phantom-textMuted block mb-1.5 uppercase tracking-wider">
                          Email
                        </label>
                        <Input
                          value={session?.user?.email || ""}
                          disabled
                          className="max-w-sm"
                        />
                      </div>
                    </div>
                  </SettingsSection>

                  <Divider />

                  <SettingsSection title="Security">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="default" size="sm">
                        <Key className="w-3.5 h-3.5" />
                        Change Password
                      </Button>
                    </div>
                  </SettingsSection>

                  <Divider />

                  <SettingsSection title="Sessions">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-phantom-bgSecondary border border-phantom-border">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-phantom-success" />
                        <div>
                          <p className="text-sm text-phantom-text">Current Session</p>
                          <p className="text-xs text-phantom-textMuted">Active now</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={handleLogout}>
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </Button>
                    </div>
                  </SettingsSection>
                </div>
              )}

              {/* ---------------------------------------------------------- */}
              {/*  Subscription Tab                                           */}
              {/* ---------------------------------------------------------- */}
              {activeTab === "subscription" && (
                <div>
                  <SettingsSection title="Your Plan">
                    <div
                      className={cn(
                        "p-5 rounded-xl border",
                        plan === "PRO"
                          ? "border-phantom-text/20 bg-gradient-to-br from-phantom-bgSecondary to-phantom-bgCard"
                          : "border-phantom-border bg-phantom-bgSecondary"
                      )}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {plan === "PRO" ? (
                            <Crown className="w-5 h-5 text-phantom-text" />
                          ) : (
                            <Ghost className="w-5 h-5 text-phantom-textMuted" />
                          )}
                          <span className="text-base font-semibold text-phantom-text">
                            {plan === "PRO" ? "Phantom Pro" : "Free Plan"}
                          </span>
                        </div>
                        {plan === "PRO" && (
                          <span className="text-xs font-mono font-medium px-2 py-1 rounded-lg bg-phantom-text/10 text-phantom-text">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-phantom-textSecondary mb-4">
                        {plan === "PRO"
                          ? "You have access to all premium features including Phantom AI, GPA Lab, Lectures, Drafts, and Campus Pulse."
                          : "Upgrade to Phantom Pro to unlock all premium features."}
                      </p>
                      {plan !== "PRO" && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => (window.location.href = "/upgrade")}
                        >
                          <Crown className="w-3.5 h-3.5" />
                          Upgrade to Pro - 9,99€/mo
                        </Button>
                      )}
                    </div>
                  </SettingsSection>

                  {plan === "PRO" && (
                    <>
                      <Divider />
                      <SettingsSection title="Features Included">
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            "Phantom AI Chat",
                            "GPA Lab & Analytics",
                            "Lecture Transcripts",
                            "Draft Factory",
                            "Campus Pulse",
                            "Priority Support",
                          ].map((feature) => (
                            <div
                              key={feature}
                              className="flex items-center gap-2 text-sm text-phantom-textSecondary"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-phantom-success" />
                              {feature}
                            </div>
                          ))}
                        </div>
                      </SettingsSection>
                    </>
                  )}
                </div>
              )}

              {/* ---------------------------------------------------------- */}
              {/*  Appearance Tab                                              */}
              {/* ---------------------------------------------------------- */}
              {activeTab === "appearance" && (
                <div>
                  <SettingsSection
                    title="Theme"
                    description="Choose how Phantom looks to you."
                  >
                    <div className="grid grid-cols-2 gap-3 max-w-sm">
                      <button
                        onClick={() => {
                          setTheme("dark");
                          updateSetting("theme", "dark");
                        }}
                        className={cn(
                          "flex flex-col items-center gap-3 p-4 rounded-xl",
                          "border transition-all duration-200",
                          theme === "dark"
                            ? "border-phantom-text bg-phantom-accentBg shadow-sm"
                            : "border-phantom-border hover:border-phantom-borderHover"
                        )}
                      >
                        <div
                          className={cn(
                            "w-full h-20 rounded-lg overflow-hidden",
                            "border border-phantom-border"
                          )}
                        >
                          <div className="h-4 bg-[#111113] border-b border-[#27272A]" />
                          <div className="h-full bg-[#09090B] p-2 space-y-1">
                            <div className="h-1.5 w-3/4 rounded bg-[#27272A]" />
                            <div className="h-1.5 w-1/2 rounded bg-[#27272A]" />
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Moon className="w-4 h-4 text-phantom-text" />
                          <span className="text-sm text-phantom-text font-medium">
                            Dark
                          </span>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setTheme("light");
                          updateSetting("theme", "light");
                        }}
                        className={cn(
                          "flex flex-col items-center gap-3 p-4 rounded-xl",
                          "border transition-all duration-200",
                          theme === "light"
                            ? "border-phantom-text bg-phantom-accentBg shadow-sm"
                            : "border-phantom-border hover:border-phantom-borderHover"
                        )}
                      >
                        <div
                          className={cn(
                            "w-full h-20 rounded-lg overflow-hidden",
                            "border border-phantom-border"
                          )}
                        >
                          <div className="h-4 bg-[#F4F4F5] border-b border-[#E4E4E7]" />
                          <div className="h-full bg-[#FAFAFA] p-2 space-y-1">
                            <div className="h-1.5 w-3/4 rounded bg-[#E4E4E7]" />
                            <div className="h-1.5 w-1/2 rounded bg-[#E4E4E7]" />
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Sun className="w-4 h-4 text-phantom-text" />
                          <span className="text-sm text-phantom-text font-medium">
                            Light
                          </span>
                        </div>
                      </button>
                    </div>
                  </SettingsSection>

                  <Divider />

                  <SettingsSection title="Language">
                    <SelectRow
                      label="Interface Language"
                      description="Changes the language of the entire interface"
                      value={settings.language}
                      onChange={(v) => updateSetting("language", v)}
                      options={[
                        { value: "en", label: "English" },
                        { value: "de", label: "Deutsch" },
                        { value: "es", label: "Español" },
                        { value: "fr", label: "Français" },
                        { value: "zh", label: "中文" },
                        { value: "ja", label: "日本語" },
                        { value: "ko", label: "한국어" },
                        { value: "pt", label: "Português" },
                      ]}
                    />
                  </SettingsSection>
                </div>
              )}

              {/* ---------------------------------------------------------- */}
              {/*  Notifications Tab                                           */}
              {/* ---------------------------------------------------------- */}
              {activeTab === "notifications" && (
                <div>
                  <SettingsSection
                    title="In-App Notifications"
                    description="Control which notifications appear in your feed."
                  >
                    <div className="divide-y divide-phantom-border/50">
                      <ToggleRow
                        label="Alerts"
                        description="Exam changes, deadline updates, urgent notices"
                        checked={settings.notificationAlerts}
                        onChange={(v) => updateSetting("notificationAlerts", v)}
                      />
                      <ToggleRow
                        label="Draft Updates"
                        description="Draft generation complete, review ready"
                        checked={settings.notificationDrafts}
                        onChange={(v) => updateSetting("notificationDrafts", v)}
                      />
                      <ToggleRow
                        label="AI Insights"
                        description="Grade predictions, study recommendations"
                        checked={settings.notificationInsights}
                        onChange={(v) =>
                          updateSetting("notificationInsights", v)
                        }
                      />
                      <ToggleRow
                        label="Lecture Notifications"
                        description="Transcript ready, flashcards generated"
                        checked={settings.notificationLectures}
                        onChange={(v) =>
                          updateSetting("notificationLectures", v)
                        }
                      />
                    </div>
                  </SettingsSection>

                  <Divider />

                  <SettingsSection title="Modes">
                    <div className="divide-y divide-phantom-border/50">
                      <ToggleRow
                        label="Do Not Disturb"
                        description="Silence all notifications"
                        checked={settings.doNotDisturb}
                        onChange={(v) => updateSetting("doNotDisturb", v)}
                      />
                      <ToggleRow
                        label="Exam Mode"
                        description="Maximize study-related notifications, minimize distractions"
                        checked={settings.examMode}
                        onChange={(v) => updateSetting("examMode", v)}
                      />
                    </div>
                  </SettingsSection>

                  <Divider />

                  <SettingsSection title="Quiet Hours">
                    <div className="flex items-center gap-3 max-w-sm">
                      <div className="flex-1">
                        <label className="text-xs text-phantom-textMuted block mb-1">
                          Start
                        </label>
                        <Input
                          type="time"
                          value={settings.quietHoursStart || ""}
                          onChange={(e) =>
                            updateSetting(
                              "quietHoursStart",
                              e.target.value || null
                            )
                          }
                          className="h-9"
                        />
                      </div>
                      <span className="text-phantom-textMuted mt-5">to</span>
                      <div className="flex-1">
                        <label className="text-xs text-phantom-textMuted block mb-1">
                          End
                        </label>
                        <Input
                          type="time"
                          value={settings.quietHoursEnd || ""}
                          onChange={(e) =>
                            updateSetting(
                              "quietHoursEnd",
                              e.target.value || null
                            )
                          }
                          className="h-9"
                        />
                      </div>
                    </div>
                  </SettingsSection>
                </div>
              )}

              {/* ---------------------------------------------------------- */}
              {/*  AI Preferences Tab                                          */}
              {/* ---------------------------------------------------------- */}
              {activeTab === "ai" && (
                <div>
                  <SettingsSection
                    title="AI Behavior"
                    description="Customize how Phantom generates content and provides guidance."
                  >
                    <div className="divide-y divide-phantom-border/50">
                      <SelectRow
                        label="Writing Tone"
                        description="Controls the formality of AI-generated text"
                        value={settings.writingTone}
                        onChange={(v) =>
                          updateSetting(
                            "writingTone",
                            v as UserSettings["writingTone"]
                          )
                        }
                        options={[
                          { value: "FORMAL", label: "Formal" },
                          { value: "BALANCED", label: "Balanced" },
                          { value: "CASUAL", label: "Casual" },
                        ]}
                      />
                      <SelectRow
                        label="Draft Autonomy"
                        description="How much freedom Phantom has when generating drafts"
                        value={settings.draftAutonomy}
                        onChange={(v) =>
                          updateSetting(
                            "draftAutonomy",
                            v as UserSettings["draftAutonomy"]
                          )
                        }
                        options={[
                          {
                            value: "CONSERVATIVE",
                            label: "Conservative (outlines only)",
                          },
                          {
                            value: "BALANCED",
                            label: "Balanced (full drafts)",
                          },
                          {
                            value: "AGGRESSIVE",
                            label: "Aggressive (near-final)",
                          },
                        ]}
                      />
                      <SelectRow
                        label="GPA Advisor Level"
                        description="Frequency and intensity of GPA-related guidance"
                        value={settings.gpaAdvisorLevel}
                        onChange={(v) =>
                          updateSetting(
                            "gpaAdvisorLevel",
                            v as UserSettings["gpaAdvisorLevel"]
                          )
                        }
                        options={[
                          { value: "RELAXED", label: "Relaxed (weekly)" },
                          { value: "ACTIVE", label: "Active (daily)" },
                          { value: "INTENSE", label: "Intense (real-time)" },
                        ]}
                      />
                    </div>
                  </SettingsSection>

                  <Divider />

                  <SettingsSection title="AI Model">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-phantom-bgSecondary border border-phantom-border">
                      <Sparkles className="w-5 h-5 text-phantom-textSecondary" />
                      <div>
                        <p className="text-sm text-phantom-text font-medium">
                          Claude Sonnet 4.5
                        </p>
                        <p className="text-xs text-phantom-textMuted">
                          Powered by Anthropic &middot; Fast & intelligent
                        </p>
                      </div>
                    </div>
                  </SettingsSection>
                </div>
              )}

              {/* ---------------------------------------------------------- */}
              {/*  Privacy Tab                                                 */}
              {/* ---------------------------------------------------------- */}
              {activeTab === "privacy" && (
                <div>
                  <SettingsSection
                    title="Data Sharing"
                    description="Control how your data is used."
                  >
                    <div className="divide-y divide-phantom-border/50">
                      <ToggleRow
                        label="Campus Pulse Participation"
                        description="Share anonymized usage data for campus-wide analytics"
                        checked={settings.campusPulseOptIn}
                        onChange={(v) => updateSetting("campusPulseOptIn", v)}
                      />
                      <ToggleRow
                        label="Leaderboard Opt-In"
                        description="Appear in anonymous campus leaderboards"
                        checked={settings.leaderboardOptIn}
                        onChange={(v) => updateSetting("leaderboardOptIn", v)}
                      />
                      <ToggleRow
                        label="AI Training Opt-In"
                        description="Allow Phantom to use your anonymized data to improve AI models"
                        checked={settings.aiTrainingOptIn}
                        onChange={(v) => updateSetting("aiTrainingOptIn", v)}
                      />
                    </div>
                  </SettingsSection>

                  <Divider />

                  <SettingsSection title="Your Data">
                    <p className="text-sm text-phantom-textSecondary leading-relaxed mb-4">
                      Phantom collects course data, lecture transcripts, and
                      assignment information to provide personalized AI
                      assistance. All data is encrypted at rest and in transit.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="default" size="sm" onClick={handleExport}>
                        <Download className="w-3.5 h-3.5" />
                        Export All Data
                      </Button>
                      <Button variant="default" size="sm">
                        <ExternalLink className="w-3.5 h-3.5" />
                        Privacy Policy
                      </Button>
                    </div>
                  </SettingsSection>

                  <Divider />

                  <SettingsSection title="Danger Zone">
                    <div className="p-4 rounded-xl border border-phantom-danger/20 bg-phantom-danger/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-phantom-text font-medium">
                            Delete Account
                          </p>
                          <p className="text-xs text-phantom-textMuted mt-0.5">
                            Permanently delete your account and all data.
                          </p>
                        </div>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => setShowDeleteConfirm(true)}
                          className="border-phantom-danger/50 text-phantom-danger hover:bg-phantom-danger/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </SettingsSection>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <DeleteConfirmation
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
}
