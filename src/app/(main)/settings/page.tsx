"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { User, Palette, Bell, Link2, Sparkles, Shield, Loader2, Sun, Moon, Save, Trash2, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store";

const TABS = [
  { id: "account", label: "Account", icon: User },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "lms", label: "LMS Connections", icon: Link2 },
  { id: "ai", label: "AI Preferences", icon: Sparkles },
  { id: "privacy", label: "Privacy", icon: Shield },
];

interface Settings {
  theme: string;
  language: string;
  writingTone: string;
  draftAutonomy: string;
  gpaAdvisorLevel: string;
  notificationAlerts: boolean;
  notificationDrafts: boolean;
  notificationInsights: boolean;
  notificationLectures: boolean;
  notificationSocial: boolean;
  pushAlerts: boolean;
  pushDrafts: boolean;
  pushInsights: boolean;
  pushSocial: boolean;
  doNotDisturb: boolean;
  examMode: boolean;
  campusPulseOptIn: boolean;
  leaderboardOptIn: boolean;
  aiTrainingOptIn: boolean;
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-body text-phantom-textSecondary">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          "w-10 h-[22px] rounded-full transition-colors relative",
          checked ? "bg-phantom-text" : "bg-phantom-border"
        )}
      >
        <div
          className={cn(
            "absolute top-[2px] w-[18px] h-[18px] rounded-full bg-phantom-bg transition-transform",
            checked ? "left-[20px]" : "left-[2px]"
          )}
        />
      </button>
    </div>
  );
}

function SelectOption({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-body text-phantom-textSecondary">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-phantom-bgInput border border-phantom-border rounded-sm px-3 py-1.5 text-body text-phantom-text focus:outline-none focus:border-phantom-borderHover"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const { theme, toggleTheme } = useThemeStore();
  const [activeTab, setActiveTab] = useState("account");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Settings>({
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
    doNotDisturb: false,
    examMode: false,
    campusPulseOptIn: true,
    leaderboardOptIn: false,
    aiTrainingOptIn: false,
  });

  useEffect(() => {
    fetch("/api/notifications/preferences")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) setSettings((prev) => ({ ...prev, ...data.settings }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateSetting = (key: string, value: boolean | string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-phantom-textMuted" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-page-title text-phantom-text">Settings</h1>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="h-9 px-4 bg-phantom-text text-phantom-bg rounded-sm text-body font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Tab Navigation */}
        <div className="md:w-48 flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-sm text-body whitespace-nowrap transition-colors",
                activeTab === tab.id
                  ? "bg-phantom-accentBg text-phantom-text font-medium"
                  : "text-phantom-textTertiary hover:text-phantom-textSecondary hover:bg-phantom-accentBg"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1"
        >
          <div className="p-5 border border-phantom-border rounded-lg bg-phantom-bgCard">
            {/* Account */}
            {activeTab === "account" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-card-title text-phantom-text mb-4">Profile</h2>
                  <div className="space-y-3">
                    <div>
                      <label className="text-caption text-phantom-textTertiary mb-1 block">Name</label>
                      <input
                        type="text"
                        defaultValue={session?.user?.name || ""}
                        className="w-full h-11 bg-phantom-bgInput border border-phantom-border rounded-md px-4 text-body text-phantom-text focus:border-phantom-borderHover focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-caption text-phantom-textTertiary mb-1 block">Email</label>
                      <input
                        type="email"
                        value={session?.user?.email || ""}
                        disabled
                        className="w-full h-11 bg-phantom-bgInput border border-phantom-border rounded-md px-4 text-body text-phantom-textMuted cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-phantom-border pt-6">
                  <h2 className="text-card-title text-phantom-text mb-4">Security</h2>
                  <button className="h-9 px-4 border border-phantom-border rounded-sm text-body text-phantom-textSecondary hover:border-phantom-borderHover transition-colors">
                    Change Password
                  </button>
                </div>

                <div className="border-t border-phantom-border pt-6">
                  <h2 className="text-card-title text-phantom-text mb-4">Data</h2>
                  <div className="flex gap-3">
                    <button className="h-9 px-4 border border-phantom-border rounded-sm text-body text-phantom-textSecondary hover:border-phantom-borderHover transition-colors flex items-center gap-2">
                      <Download className="w-3.5 h-3.5" />
                      Export Data
                    </button>
                    <button className="h-9 px-4 border border-phantom-danger/50 rounded-sm text-body text-phantom-danger hover:bg-phantom-danger/10 transition-colors flex items-center gap-2">
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance */}
            {activeTab === "appearance" && (
              <div>
                <h2 className="text-card-title text-phantom-text mb-4">Theme</h2>
                <div className="flex gap-3">
                  <button
                    onClick={() => { if (theme !== "dark") toggleTheme(); }}
                    className={cn(
                      "flex-1 p-4 rounded-lg border transition-all flex flex-col items-center gap-2",
                      theme === "dark" ? "border-phantom-text bg-phantom-accentBg" : "border-phantom-border hover:border-phantom-borderHover"
                    )}
                  >
                    <Moon className="w-5 h-5 text-phantom-text" />
                    <span className="text-body text-phantom-text">Dark</span>
                  </button>
                  <button
                    onClick={() => { if (theme !== "light") toggleTheme(); }}
                    className={cn(
                      "flex-1 p-4 rounded-lg border transition-all flex flex-col items-center gap-2",
                      theme === "light" ? "border-phantom-text bg-phantom-accentBg" : "border-phantom-border hover:border-phantom-borderHover"
                    )}
                  >
                    <Sun className="w-5 h-5 text-phantom-text" />
                    <span className="text-body text-phantom-text">Light</span>
                  </button>
                </div>
                <div className="mt-6">
                  <SelectOption
                    label="Language"
                    value={settings.language}
                    onChange={(v) => updateSetting("language", v)}
                    options={[
                      { value: "en", label: "English" },
                      { value: "es", label: "Spanish" },
                      { value: "de", label: "German" },
                      { value: "fr", label: "French" },
                      { value: "zh", label: "Mandarin" },
                    ]}
                  />
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-card-title text-phantom-text mb-3">In-App Notifications</h2>
                  <Toggle label="Alerts (exam changes, deadline updates)" checked={settings.notificationAlerts} onChange={(v) => updateSetting("notificationAlerts", v)} />
                  <Toggle label="Draft notifications" checked={settings.notificationDrafts} onChange={(v) => updateSetting("notificationDrafts", v)} />
                  <Toggle label="AI insights" checked={settings.notificationInsights} onChange={(v) => updateSetting("notificationInsights", v)} />
                  <Toggle label="Lecture transcriptions" checked={settings.notificationLectures} onChange={(v) => updateSetting("notificationLectures", v)} />
                  <Toggle label="Campus Pulse updates" checked={settings.notificationSocial} onChange={(v) => updateSetting("notificationSocial", v)} />
                </div>
                <div className="border-t border-phantom-border pt-6">
                  <h2 className="text-card-title text-phantom-text mb-3">Push Notifications</h2>
                  <Toggle label="Push alerts" checked={settings.pushAlerts} onChange={(v) => updateSetting("pushAlerts", v)} />
                  <Toggle label="Push for drafts" checked={settings.pushDrafts} onChange={(v) => updateSetting("pushDrafts", v)} />
                  <Toggle label="Push for insights" checked={settings.pushInsights} onChange={(v) => updateSetting("pushInsights", v)} />
                  <Toggle label="Push for social" checked={settings.pushSocial} onChange={(v) => updateSetting("pushSocial", v)} />
                </div>
                <div className="border-t border-phantom-border pt-6">
                  <h2 className="text-card-title text-phantom-text mb-3">Modes</h2>
                  <Toggle label="Do Not Disturb" checked={settings.doNotDisturb} onChange={(v) => updateSetting("doNotDisturb", v)} />
                  <Toggle label="Exam Mode (maximize study notifications)" checked={settings.examMode} onChange={(v) => updateSetting("examMode", v)} />
                </div>
              </div>
            )}

            {/* LMS */}
            {activeTab === "lms" && (
              <div>
                <h2 className="text-card-title text-phantom-text mb-4">Connected Platforms</h2>
                <div className="space-y-3">
                  <div className="p-3 border border-phantom-border rounded-lg flex items-center gap-3">
                    <div className="w-10 h-10 rounded-sm bg-phantom-bgTertiary flex items-center justify-center">
                      <span className="text-phantom-text font-bold">C</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-body text-phantom-text">Canvas</p>
                      <p className="text-caption text-phantom-textTertiary">Connected · Last synced just now</p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-phantom-success" />
                  </div>
                </div>
                <button className="mt-4 h-9 px-4 border border-dashed border-phantom-border rounded-sm text-body text-phantom-textTertiary hover:border-phantom-borderHover transition-colors">
                  + Add another LMS
                </button>
              </div>
            )}

            {/* AI Preferences */}
            {activeTab === "ai" && (
              <div className="space-y-4">
                <h2 className="text-card-title text-phantom-text mb-4">AI Behavior</h2>
                <SelectOption
                  label="Writing tone"
                  value={settings.writingTone}
                  onChange={(v) => updateSetting("writingTone", v)}
                  options={[
                    { value: "FORMAL", label: "More Formal" },
                    { value: "BALANCED", label: "Balanced" },
                    { value: "CASUAL", label: "More Casual" },
                  ]}
                />
                <SelectOption
                  label="Draft autonomy"
                  value={settings.draftAutonomy}
                  onChange={(v) => updateSetting("draftAutonomy", v)}
                  options={[
                    { value: "CONSERVATIVE", label: "Conservative (outlines only)" },
                    { value: "BALANCED", label: "Balanced (full drafts, needs editing)" },
                    { value: "AGGRESSIVE", label: "Aggressive (near-final drafts)" },
                  ]}
                />
                <SelectOption
                  label="GPA advisor level"
                  value={settings.gpaAdvisorLevel}
                  onChange={(v) => updateSetting("gpaAdvisorLevel", v)}
                  options={[
                    { value: "RELAXED", label: "Relaxed (weekly tips)" },
                    { value: "ACTIVE", label: "Active (daily recommendations)" },
                    { value: "INTENSE", label: "Intense (real-time alerts)" },
                  ]}
                />
              </div>
            )}

            {/* Privacy */}
            {activeTab === "privacy" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-card-title text-phantom-text mb-3">Data Sharing</h2>
                  <Toggle label="Participate in Campus Pulse (anonymized)" checked={settings.campusPulseOptIn} onChange={(v) => updateSetting("campusPulseOptIn", v)} />
                  <Toggle label="Appear in leaderboards (anonymous)" checked={settings.leaderboardOptIn} onChange={(v) => updateSetting("leaderboardOptIn", v)} />
                  <Toggle label="Allow Phantom to use my data for AI improvement" checked={settings.aiTrainingOptIn} onChange={(v) => updateSetting("aiTrainingOptIn", v)} />
                </div>
                <div className="border-t border-phantom-border pt-6">
                  <h2 className="text-card-title text-phantom-text mb-3">Transparency</h2>
                  <p className="text-body text-phantom-textSecondary">
                    Phantom collects course data, lecture transcripts, and assignment information to provide personalized AI assistance. All data is encrypted at rest and in transit.
                  </p>
                  <button className="mt-3 text-body text-phantom-textSecondary underline hover:text-phantom-text transition-colors">
                    View full transparency log
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
