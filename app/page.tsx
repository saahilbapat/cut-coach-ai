"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { AnalysisCards } from "../components/AnalysisCards";
import { CheckInForm } from "../components/CheckInForm";
import { CheckInHistory } from "../components/CheckInHistory";
import { MainNav } from "../components/MainNav";
import { MigrationPrompt } from "../components/MigrationPrompt";
import { useRouter } from "next/navigation";
import { buildAIContext } from "../lib/aiContext";
import {
  createEmptyCheckIn,
  createSignature,
  getDashboardStats,
  getLocalDateString,
  parseLocalDate,
  saveCheckInToList,
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

function getHeroMessage(savedCount: number, streak: number, hasTodayLog: boolean) {
  if (!hasTodayLog) return "Today's check-in is waiting.";
  if (streak >= 7) return "You're building excellent consistency.";
  if (savedCount >= 3) return "The pattern is starting to show.";
  return "Let's finish today's log.";
}

function hasCheckInContent(checkIn: CheckIn) {
  return (
    checkIn.weight.trim() !== "" ||
    checkIn.steps.trim() !== "" ||
    checkIn.workout.trim() !== "" ||
    checkIn.workoutType !== "Push" ||
    checkIn.workoutDuration.trim() !== "" ||
    checkIn.cardioType.trim() !== "" ||
    checkIn.cardioDuration.trim() !== "" ||
    checkIn.breakfast.trim() !== "" ||
    checkIn.lunch.trim() !== "" ||
    checkIn.dinner.trim() !== "" ||
    checkIn.snacks.trim() !== "" ||
    checkIn.alcohol.trim() !== "" ||
    checkIn.water.trim() !== "" ||
    checkIn.hunger.trim() !== "" ||
    checkIn.energy.trim() !== "" ||
    checkIn.mood.trim() !== "" ||
    checkIn.notes.trim() !== ""
  );
}

export default function Home() {
  const router = useRouter();
  const [currentLocalDate, setCurrentLocalDate] = useState(() => getLocalDateString());
  const [form, setForm] = useState<CheckIn>(() => createEmptyCheckIn(currentLocalDate));
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
  const currentLocalDateRef = useRef(currentLocalDate);
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
    currentLocalDateRef.current = currentLocalDate;
  }, [currentLocalDate]);

  useEffect(() => {
    const refreshCurrentDate = () => {
      const nextDate = getLocalDateString();
      const previousDate = currentLocalDateRef.current;

      if (previousDate === nextDate) return;

      currentLocalDateRef.current = nextDate;
      setCurrentLocalDate(nextDate);
      setForm((currentForm) =>
        currentForm.date === previousDate && !hasCheckInContent(currentForm)
          ? createEmptyCheckIn(nextDate)
          : currentForm
      );
      setAnalysis(null);
      setLastAnalysisSignature("");
    };
    const dateRefreshInterval = window.setInterval(refreshCurrentDate, 60_000);

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

    return () => window.clearInterval(dateRefreshInterval);
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
    if (!form.date) {
      throw new Error("Choose a date before saving this check-in.");
    }

    const checkInToSave = { ...form };
    const updated = saveCheckInToList(saved, checkInToSave);
    const supabase = createClient();

    await upsertCheckIn(supabase, checkInToSave);
    saveCheckIns(updated);
    setSaved(updated);
    setMessage(`Saved check-in for ${checkInToSave.date}.`);

    return updated;
  }

  function loadCheckIn(checkIn: CheckIn) {
    setForm({ ...checkIn });
    rememberAnalysis(checkIn, saved);
    setMessage(`Loaded ${checkIn.date}. You can edit and save again.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startToday() {
    const localToday = getLocalDateString();
    const todayLog = saved.find((item) => item.date === localToday);
    const nextForm = todayLog ? { ...todayLog } : createEmptyCheckIn(localToday);

    currentLocalDateRef.current = localToday;
    setCurrentLocalDate(localToday);
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
      const checkInForAnalysis = { ...form };
      const updated = await saveCheckIn();
      const { checkInLog, signature, stored } = rememberAnalysis(checkInForAnalysis, updated);

      if (stored) {
        setMessage(`Saved check-in for ${checkInForAnalysis.date}. Showing saved analysis.`);
        scrollToAnalysis();
        return;
      }

      if (analysis && signature === lastAnalysisSignature) {
        setMessage(`Saved check-in for ${checkInForAnalysis.date}. Showing existing analysis.`);
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
      saveStoredAnalysis(checkInForAnalysis.date, signature, data.analysis);
      await upsertAnalysis(createClient(), checkInForAnalysis.date, signature, data.analysis);
      const nextStoredAnalyses = [
        ...storedAnalyses.filter(
          (item) => !(item.date === checkInForAnalysis.date && item.signature === signature)
        ),
        { date: checkInForAnalysis.date, signature, analysis: data.analysis },
      ];
      setStoredAnalyses(nextStoredAnalyses);
      const updatedFoodMemory = applyFoodMemoryDetections(foodMemory, checkInForAnalysis);
      const syncedFoodMemory = await Promise.all(
        updatedFoodMemory.map((item) => upsertFoodMemory(createClient(), item))
      );
      saveFoodMemory(syncedFoodMemory);
      setFoodMemory(syncedFoodMemory);
      const updatedInput = buildAIContext({
        currentCheckIn: checkInForAnalysis,
        foodMemory: syncedFoodMemory,
        savedCheckIns: updated,
        profile,
        storedAnalyses: nextStoredAnalyses,
      });
      const updatedSignature = createSignature(updatedInput);
      if (updatedSignature !== signature) {
        saveStoredAnalysis(checkInForAnalysis.date, updatedSignature, data.analysis);
        await upsertAnalysis(createClient(), checkInForAnalysis.date, updatedSignature, data.analysis);
        setLastAnalysisSignature(updatedSignature);
      }
      setMessage(`Saved and analyzed check-in for ${checkInForAnalysis.date}.`);
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

  const stats = getDashboardStats(saved, currentLocalDate);
  const hasTodayLog = saved.some((item) => item.date === currentLocalDate);
  const displayName = profile.name.trim() || "there";
  const heroMessage = getHeroMessage(saved.length, stats.streak, hasTodayLog);
  const dashboardUnlocked = saved.length >= 2;
  const formattedToday = new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(parseLocalDate(currentLocalDate));

  return (
    <main className="min-h-screen overflow-x-hidden bg-black px-3 py-3 text-white sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-7xl">
        <header className="rounded-[1.75rem] border border-white/10 bg-slate-950 p-4 shadow-2xl shadow-black/50 sm:rounded-[2.5rem] sm:p-8 lg:p-9">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-400">
                Cut Coach AI
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">
                Today&apos;s Log
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                {displayName}, {heroMessage} Save today&apos;s log to get your AI coach
                analysis immediately.
              </p>
            </div>

            <div className="grid gap-2 sm:min-w-80 sm:grid-cols-2">
              <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-3 sm:rounded-[1.75rem] sm:p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Today
                </p>
                <p className="mt-2 text-base font-black text-white">{formattedToday}</p>
              </div>
              <div className="rounded-[1.25rem] border border-emerald-400/20 bg-emerald-400/10 p-3 sm:rounded-[1.75rem] sm:p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Logs
                </p>
                <p className="mt-2 text-base font-black text-emerald-200">
                  {saved.length} days
                </p>
              </div>
              <button
                onClick={startToday}
                className="min-h-12 rounded-[1.25rem] bg-emerald-400 p-3 text-sm font-black text-black shadow-xl shadow-emerald-400/20 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-300 sm:col-span-2 sm:rounded-[1.75rem] sm:p-4"
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

        {message && (
          <div className="mt-5 rounded-3xl border border-green-500/30 bg-green-500/10 p-4 text-sm font-semibold text-green-200">
            {message}
          </div>
        )}

        {!dashboardUnlocked && (
          <div className="mt-5 rounded-[1.75rem] border border-white/10 bg-slate-950 p-4 text-sm font-semibold leading-6 text-slate-300 shadow-xl shadow-black/20">
            Daily AI analysis is available now. Log at least 2 days to unlock dashboard
            trends, progress charts, weekly averages, and long-term coaching patterns.
          </div>
        )}

        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)] lg:items-start">
          <CheckInForm
            form={form}
            isAnalyzing={isAnalyzing}
            onSubmit={saveAndAnalyzeCheckIn}
            updateField={updateField}
          />

          <div ref={analysisSectionRef} className="scroll-mt-24 space-y-6 lg:sticky lg:top-24">
            <AnalysisCards
              analysis={analysis}
              analysisError={analysisError}
              isAnalyzing={isAnalyzing}
            />
          </div>
        </div>

        <div className="mt-8 pb-6">
          <CheckInHistory saved={saved} loadCheckIn={loadCheckIn} />
        </div>
      </div>
    </main>
  );
}
