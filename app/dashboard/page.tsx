"use client";

import { useEffect, useState } from "react";
import { AnalysisCards } from "../../components/AnalysisCards";
import { DashboardStats } from "../../components/DashboardStats";
import { MainNav } from "../../components/MainNav";
import { getDashboardStats } from "../../lib/checkins";
import { emptyProfile } from "../../lib/profile";
import {
  loadCheckIns,
  loadProfile,
  loadStoredAnalyses,
  saveCheckIns,
  saveFoodMemory,
  saveProfile,
} from "../../lib/storage";
import { createClient } from "../../lib/supabase/client";
import {
  getAnalyses,
  getCheckIns,
  getFoodMemory,
  getProfile,
} from "../../lib/supabase/queries";
import type { Analysis, CheckIn, UserProfile } from "../../lib/types";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [saved, setSaved] = useState<CheckIn[]>([]);
  const [profile, setProfile] = useState<UserProfile>(emptyProfile);
  const [latestAnalysis, setLatestAnalysis] = useState<Analysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadDashboardData() {
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

        const [cloudProfile, cloudCheckIns, cloudAnalyses, cloudFoodMemory] =
          await Promise.all([
            getProfile(supabase),
            getCheckIns(supabase),
            getAnalyses(supabase),
            getFoodMemory(supabase),
          ]);
        const nextProfile = cloudProfile || loadProfile(emptyProfile);
        const latest = [...cloudAnalyses].sort((a, b) => b.date.localeCompare(a.date))[0];

        setProfile(nextProfile);
        setSaved(cloudCheckIns);
        setLatestAnalysis(latest?.analysis || null);
        saveProfile(nextProfile);
        saveCheckIns(cloudCheckIns);
        saveFoodMemory(cloudFoodMemory);
      } catch (error) {
        console.error(error);
        const localAnalyses = loadStoredAnalyses();
        const latest = [...localAnalyses].sort((a, b) => b.date.localeCompare(a.date))[0];

        setSaved(loadCheckIns());
        setProfile(loadProfile(emptyProfile));
        setLatestAnalysis(latest?.analysis || null);
        setMessage("Loaded local dashboard cache because cloud data could not be reached.");
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, [router]);

  const stats = getDashboardStats(saved);
  const dashboardUnlocked = saved.length >= 2;

  return (
    <main className="min-h-screen overflow-x-hidden bg-black px-3 py-3 text-white sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-7xl">
        <header className="rounded-[1.75rem] border border-white/10 bg-slate-950 p-4 shadow-2xl shadow-black/50 sm:rounded-[2.5rem] sm:p-8 lg:p-9">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-400">
            Cut Coach AI
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">
            Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Trends unlock after two saved check-ins so the coach has enough signal.
          </p>
        </header>

        <MainNav />

        {isLoading && (
          <div className="mt-5 rounded-3xl border border-white/10 bg-slate-950 p-5 text-sm font-semibold text-slate-300">
            Loading your dashboard...
          </div>
        )}

        {message && (
          <div className="mt-5 rounded-3xl border border-green-500/30 bg-green-500/10 p-4 text-sm font-semibold text-green-200">
            {message}
          </div>
        )}

        {!isLoading && !dashboardUnlocked ? (
          <section className="mt-5 rounded-[2rem] border border-white/10 bg-slate-950 p-6 text-center shadow-2xl shadow-black/30 sm:p-10">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-400">
              Trends Locked
            </p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-4xl">
              Log at least 2 days to unlock your dashboard trends.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">
              Your daily log is ready now. Once there are two saved days, this page will show
              trend cards, cut score context, and progress patterns.
            </p>
          </section>
        ) : null}

        {!isLoading && dashboardUnlocked ? (
          <>
            <DashboardStats
              {...stats}
              cutScore={latestAnalysis?.cutScore}
              goalWeight={profile.goalWeight}
              saved={saved}
            />

            <div className="mt-6 pb-6">
              <AnalysisCards
                analysis={latestAnalysis}
                analysisError=""
                isAnalyzing={false}
              />
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
