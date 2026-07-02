"use client";

import { formatEstimate } from "../lib/checkins";
import type { Analysis } from "../lib/types";

type AnalysisCardsProps = {
  analysis: Analysis | null;
  analysisError: string;
  isAnalyzing: boolean;
};

export function AnalysisCards({ analysis, analysisError, isAnalyzing }: AnalysisCardsProps) {
  if (!analysis && !analysisError && !isAnalyzing) {
    return (
      <section className="rounded-[2.5rem] border border-white/10 bg-slate-950 p-6 shadow-2xl shadow-black/35 sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-400">
          AI Coach
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
          Coaching appears here.
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Finish today&apos;s check-in and the coach will give you the signal: what worked,
          what to tighten, and what to do tomorrow.
        </p>
      </section>
    );
  }

  const card =
    "rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 shadow-xl shadow-black/10 transition duration-300 hover:-translate-y-0.5";
  const label = "text-xs font-black uppercase tracking-[0.18em] text-emerald-400";

  return (
    <section className="rounded-[2.5rem] border border-emerald-400/20 bg-slate-950 p-5 shadow-2xl shadow-black/40 sm:p-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-400">
            AI Coach
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Coach feedback
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Coaching first. Macro estimates are approximate.
          </p>
        </div>
        {analysis && (
          <div className="rounded-[1.75rem] border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-right">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Score
            </p>
            <p className="mt-1 text-4xl font-black text-emerald-300">
              {Math.round(analysis.cutScore)}
            </p>
          </div>
        )}
      </div>

      {isAnalyzing && (
        <div className="mt-6 rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-5">
          <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-black/40">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-emerald-300" />
          </div>
          <p className="font-black text-emerald-100">Coach is reviewing your day...</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Estimating nutrition, checking your recent trends, and preparing tomorrow&apos;s
            mission.
          </p>
        </div>
      )}

      {analysisError && (
        <div className="mt-6 rounded-[2rem] border border-red-500/40 bg-red-500/10 p-5 text-sm font-semibold leading-6 text-red-100">
          {analysisError}
        </div>
      )}

      {analysis && (
        <div className="mt-6 grid gap-4">
          <div className="rounded-[2rem] border border-emerald-400/25 bg-emerald-400/10 p-6 shadow-xl shadow-emerald-950/20">
            <p className={label}>Today&apos;s Cut Score</p>
            <div className="mt-4 flex items-end gap-3">
              <p className="text-6xl font-black tracking-tight text-white">
                {Math.round(analysis.cutScore)}
              </p>
              <p className="pb-2 text-lg font-black text-emerald-200">/ 100</p>
            </div>
            <p className="mt-4 text-base font-semibold leading-7 text-emerald-50">
              {analysis.coachingNote}
            </p>
          </div>

          <div className={card}>
            <p className={label}>Biggest Win</p>
            <p className="mt-3 text-lg font-bold leading-7 text-white">
              {analysis.biggestWin}
            </p>
          </div>

          <div className={card}>
            <p className={label}>Biggest Opportunity</p>
            <p className="mt-3 text-lg font-bold leading-7 text-white">
              {analysis.biggestIssue}
            </p>
          </div>

          <div className={card}>
            <p className={label}>Weekly Trend</p>
            <p className="mt-3 text-base font-semibold leading-7 text-slate-100">
              {analysis.trendObservation}
            </p>
          </div>

          <div className={card}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={label}>Estimated Intake</p>
                <p className="mt-2 text-sm text-slate-500">
                  Macro estimates are approximate.
                </p>
              </div>
              <p className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-bold text-slate-300">
                {analysis.confidence}
              </p>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-[1.35rem] bg-black/35 p-4">
                <p className="text-xs font-semibold text-slate-500">Calories</p>
                <p className="mt-1 text-2xl font-black text-white">
                  {formatEstimate(analysis.estimatedCalories, "")}
                </p>
              </div>
              <div className="rounded-[1.35rem] bg-black/35 p-4">
                <p className="text-xs font-semibold text-slate-500">Protein</p>
                <p className="mt-1 text-2xl font-black text-white">
                  {formatEstimate(analysis.estimatedProtein, "g")}
                </p>
              </div>
              <div className="rounded-[1.35rem] bg-black/35 p-4">
                <p className="text-xs font-semibold text-slate-500">Carbs</p>
                <p className="mt-1 text-2xl font-black text-white">
                  {formatEstimate(analysis.estimatedCarbs, "g")}
                </p>
              </div>
              <div className="rounded-[1.35rem] bg-black/35 p-4">
                <p className="text-xs font-semibold text-slate-500">Fat</p>
                <p className="mt-1 text-2xl font-black text-white">
                  {formatEstimate(analysis.estimatedFat, "g")}
                </p>
              </div>
            </div>
          </div>

          <div className={card}>
            <p className={label}>Tomorrow&apos;s Mission</p>
            <ul className="mt-4 space-y-2">
              {analysis.tomorrowMission.map((goal) => (
                <li
                  key={goal}
                  className="rounded-[1.35rem] border border-white/10 bg-black/35 px-4 py-3 text-sm font-bold leading-6 text-slate-100"
                >
                  {goal}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
