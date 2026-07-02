"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { AnalysisCards } from "../components/AnalysisCards";
import { CheckInForm } from "../components/CheckInForm";
import { CheckInHistory } from "../components/CheckInHistory";
import { DashboardStats } from "../components/DashboardStats";
import { MainNav } from "../components/MainNav";
import { MigrationPrompt } from "../components/MigrationPrompt";
import { useRouter } from "next/navigation";
import { buildAIContext } from "../lib/aiContext";
import {
  createSignature,
  emptyCheckIn,
  getDashboardStats,
  saveCheckInToList,
  today,
} from "../lib/checkins";
import { applyFoodMemoryDetections } from "../lib/foodMemory";
import { emptyProfile } from "../lib/profile";
import {
  loadCheckIns,
  loadFoodMemory,
  loadProfile,
  loadStoredAnalyses,
  saveCheckIns,
  saveFoodMemory,
  saveProfile,
  saveStoredAnalysis,
} from "../lib/storage";
import { createClient } from "../lib/supabase/client";
import {
  getAnalyses,
  getCheckIns,
  getFoodMemory,
  getProfile,
  upsertFoodMemory,
  upsertAnalysis,
  upsertCheckIn,
} from "../lib/supabase/queries";
import type { Analysis, CheckIn, FoodMemoryItem, StoredAnalysis, UserProfile } from "../lib/types";

const MIGRATION_KEY = "cut-supabase-migrated";

function hasPendingLocalMigrationData() {
  return (
    loadCheckIns().length > 0 ||
    loadStoredAnalyses().length > 0 ||
    loadFoodMemory().length > 0 ||
    localStorage.getItem("cut-checkin-profile") !== null
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getHeroMessage(savedCount: number, streak: number, hasTodayLog: boolean) {
  if (!hasTodayLog) return "Today's check-in is waiting.";
  if (streak >= 7) return "You're building excellent consistency.";
  if (savedCount >= 3) return "The pattern is starting to show.";
  return "Let's finish today's log.";
}

export default function Home() {
  const router = useRouter();
  const [form, setForm] = useState<CheckIn>(emptyCheckIn);
  const [saved, setSaved] = useState<CheckIn[]>([]);
  const [storedAnalyses, setStoredAnalyses] = useState<StoredAnalysis[]>([]);
  const [foodMemory, setFoodMemory] = useState<FoodMemoryItem[]>([]);
  const [message, setMessage] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analysisError, setAnalysisError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastAnalysisSignature, setLastAnalysisSignature] = useState("");
  const [profile, setProfile] = useState<UserProfile>(emptyProfile);
  const analyzingRef = useRef(false);
  const analysisSectionRef = useRef<HTMLDivElement>(null);

  const loadCloudData = useCallback(async (syncLocalCache = true) => {
    const supabase = createClient();
    const [cloudProfile, cloudCheckIns, cloudAnalyses, cloudFoodMemory] =
      await Promise.all([
        getProfile(supabase),
        getCheckIns(supabase),
        getAnalyses(supabase),
        getFoodMemory(supabase),
      ]);
    const nextProfile = cloudProfile || loadProfile(emptyProfile);

    setProfile(nextProfile);
    setSaved(cloudCheckIns);
    setStoredAnalyses(cloudAnalyses);
    setFoodMemory(cloudFoodMemory);

    if (syncLocalCache) {
      saveProfile(nextProfile);
      saveCheckIns(cloudCheckIns);
      saveFoodMemory(cloudFoodMemory);
    }
  }, []);

  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);

      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.replace("/login");
          return;
        }

        await loadCloudData(
          localStorage.getItem(MIGRATION_KEY) === "true" ||
            !hasPendingLocalMigrationData()
        );
      } catch (error) {
        console.error(error);
        setSaved(loadCheckIns());
        setStoredAnalyses(loadStoredAnalyses());
        setFoodMemory(loadFoodMemory());
        setProfile(loadProfile(emptyProfile));
        setMessage("Loaded local cache because cloud data could not be reached.");
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData();
  }, [loadCloudData, router]);

  function updateField(field: keyof CheckIn, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function rememberAnalysis(
    checkIn: CheckIn,
    savedCheckIns: CheckIn[],
    analyses = storedAnalyses,
    memories = foodMemory,
    currentProfile = profile
  ) {
    const input = buildAIContext({
      currentCheckIn: checkIn,
      foodMemory: memories,
      savedCheckIns,
      profile: currentProfile,
      storedAnalyses: analyses,
    });
    const signature = createSignature(input);
    const stored = analyses.find(
      (item) => item.date === checkIn.date && item.signature === signature
    );

    if (stored) {
      setAnalysis(stored.analysis);
      setLastAnalysisSignature(signature);
      setAnalysisError("");
    } else {
      setAnalysis(null);
      setLastAnalysisSignature("");
    }

    return { checkInLog: input, input, signature, stored };
  }

  function scrollToAnalysis() {
    window.setTimeout(() => {
      analysisSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }

  async function saveCheckIn() {
    const updated = saveCheckInToList(saved, form);
    const supabase = createClient();

    await upsertCheckIn(supabase, form);
    saveCheckIns(updated);
    setSaved(updated);
    setMessage(`Saved check-in for ${form.date}.`);

    return updated;
  }

  function loadCheckIn(checkIn: CheckIn) {
    setForm(checkIn);
    rememberAnalysis(checkIn, saved);
    setMessage(`Loaded ${checkIn.date}. You can edit and save again.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startToday() {
    const todayLog = saved.find((item) => item.date === today);
    const nextForm = todayLog || emptyCheckIn;

    setForm(nextForm);
    rememberAnalysis(nextForm, saved);
    setMessage(todayLog ? "Loaded today's saved log." : "Ready for today's log.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveAndAnalyzeCheckIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (analyzingRef.current) return;

    analyzingRef.current = true;
    setIsAnalyzing(true);
    setAnalysisError("");

    try {
      const updated = await saveCheckIn();
      const { checkInLog, signature, stored } = rememberAnalysis(form, updated);

      if (stored) {
        setMessage(`Saved check-in for ${form.date}. Showing saved analysis.`);
        scrollToAnalysis();
        return;
      }

      if (analysis && signature === lastAnalysisSignature) {
        setMessage(`Saved check-in for ${form.date}. Showing existing analysis.`);
        scrollToAnalysis();
        return;
      }

      setAnalysis(null);

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          checkIn: checkInLog,
          profileContext: "Rich profile, trend, behavior, and prior-coaching context is included in the checkIn payload.",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to analyze check-in.");
      }

      setAnalysis(data.analysis || null);
      setLastAnalysisSignature(signature);
      saveStoredAnalysis(form.date, signature, data.analysis);
      await upsertAnalysis(createClient(), form.date, signature, data.analysis);
      const nextStoredAnalyses = [
        ...storedAnalyses.filter(
          (item) => !(item.date === form.date && item.signature === signature)
        ),
        { date: form.date, signature, analysis: data.analysis },
      ];
      setStoredAnalyses(nextStoredAnalyses);
      const updatedFoodMemory = applyFoodMemoryDetections(foodMemory, form);
      const syncedFoodMemory = await Promise.all(
        updatedFoodMemory.map((item) => upsertFoodMemory(createClient(), item))
      );
      saveFoodMemory(syncedFoodMemory);
      setFoodMemory(syncedFoodMemory);
      const updatedInput = buildAIContext({
        currentCheckIn: form,
        foodMemory: syncedFoodMemory,
        savedCheckIns: updated,
        profile,
        storedAnalyses: nextStoredAnalyses,
      });
      const updatedSignature = createSignature(updatedInput);
      if (updatedSignature !== signature) {
        saveStoredAnalysis(form.date, updatedSignature, data.analysis);
        await upsertAnalysis(createClient(), form.date, updatedSignature, data.analysis);
        setLastAnalysisSignature(updatedSignature);
      }
      setMessage(`Saved and analyzed check-in for ${form.date}.`);
      scrollToAnalysis();
    } catch (error) {
      console.error(error);
      setAnalysisError("Could not analyze this check-in. Check the server console.");
      scrollToAnalysis();
    } finally {
      analyzingRef.current = false;
      setIsAnalyzing(false);
    }
  }

  const stats = getDashboardStats(saved);
  const hasTodayLog = saved.some((item) => item.date === today);
  const displayName = profile.name.trim() || "there";
  const heroMessage = getHeroMessage(saved.length, stats.streak, hasTodayLog);
  const formattedToday = new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date(`${today}T12:00:00`));

  return (
    <main className="min-h-screen bg-black px-4 py-5 text-white sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-7xl">
        <header className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-950 p-5 shadow-2xl shadow-black/50 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-400">
                Cut Coach AI
              </p>
              <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
                {getGreeting()}, {displayName}.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
                Day {Math.max(saved.length, 1)} of your journey. {heroMessage}
              </p>
            </div>

            <div className="grid gap-3 sm:min-w-96 sm:grid-cols-2">
              <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Today
                </p>
                <p className="mt-2 text-base font-black text-white">{formattedToday}</p>
              </div>
              <div className="rounded-[1.75rem] border border-emerald-400/20 bg-emerald-400/10 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Streak
                </p>
                <p className="mt-2 text-base font-black text-emerald-200">
                  {stats.streak} days
                </p>
              </div>
              <div className="rounded-[1.75rem] border border-white/10 bg-black/25 p-4 sm:col-span-2">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Coach Status
                </p>
                <p className="mt-2 text-xl font-black text-white">{heroMessage}</p>
              </div>
              <button
                onClick={startToday}
                className="rounded-[1.75rem] bg-emerald-400 p-4 text-sm font-black text-black shadow-xl shadow-emerald-400/20 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-300 sm:col-span-2"
              >
                Start / Load Today
              </button>
            </div>
          </div>
        </header>
        <MainNav />

        {isLoading && (
          <div className="mt-5 rounded-3xl border border-white/10 bg-slate-950 p-5 text-sm font-semibold text-slate-300">
            Loading your synced coach data...
          </div>
        )}

        {!isLoading && <MigrationPrompt onImported={loadCloudData} />}

        <DashboardStats
          {...stats}
          cutScore={analysis?.cutScore}
          goalWeight={profile.goalWeight}
          saved={saved}
        />

        {message && (
          <div className="mt-5 rounded-3xl border border-green-500/30 bg-green-500/10 p-4 text-sm font-semibold text-green-200">
            {message}
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] lg:items-start">
          <CheckInForm
            form={form}
            isAnalyzing={isAnalyzing}
            onSubmit={saveAndAnalyzeCheckIn}
            updateField={updateField}
          />

          <div ref={analysisSectionRef} className="scroll-mt-6 space-y-6 lg:sticky lg:top-6">
            <AnalysisCards
              analysis={analysis}
              analysisError={analysisError}
              isAnalyzing={isAnalyzing}
            />
          </div>
        </div>

        <div className="mt-10">
          <CheckInHistory saved={saved} loadCheckIn={loadCheckIn} />
        </div>
      </div>
    </main>
  );
}
