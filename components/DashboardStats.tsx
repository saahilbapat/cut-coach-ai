"use client";

import { getDashboardHighlightGraph } from "../lib/checkins";
import type { CheckIn } from "../lib/types";

type DashboardStatsProps = {
  alcoholFreeDaysLast7: number;
  avgSteps7: number | null;
  avgWater7: number | null;
  avgWeight7: number | null;
  coachStatus: string;
  cutScore?: number | null;
  goalWeight?: string;
  latestWeight?: string;
  missingDates: string[];
  recentTrend: {
    activityConsistency: string;
    alcoholPattern: string;
    weightDirection: string;
    workoutConsistency: string;
  };
  saved: CheckIn[];
  streak: number;
  weightChange?: string | null;
  weightChangeLast7: number | null;
  workoutsLast7: number;
};

function getCoachMessage(coachStatus: string, streak: number) {
  if (coachStatus.includes("On Track")) return "You're building excellent consistency.";
  if (coachStatus.includes("Close")) return "You're close. One small fix can tighten the week.";
  if (streak === 0) return "Today's check-in is waiting.";
  return "Let's finish today's log and clean up the next move.";
}

function parseNumber(value?: string | null) {
  if (!value) return null;
  const match = value.match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

export function DashboardStats({
  alcoholFreeDaysLast7,
  avgSteps7,
  avgWeight7,
  coachStatus,
  cutScore,
  goalWeight,
  latestWeight,
  missingDates,
  recentTrend,
  saved,
  streak,
  weightChange,
  weightChangeLast7,
  workoutsLast7,
}: DashboardStatsProps) {
  const graph = getDashboardHighlightGraph(saved, 30);
  const weightGraph = graph.filter((item) => item.weight !== null && item.weightPercent !== null);
  const points = weightGraph
    .map((item, index) => {
      const x = weightGraph.length <= 1 ? 50 : (index / (weightGraph.length - 1)) * 100;
      const y = 100 - (item.weightPercent || 0);
      return `${x},${y}`;
    })
    .join(" ");
  const currentWeight = latestWeight || (avgWeight7 ? `${avgWeight7} lb` : "-");
  const parsedCurrentWeight = parseNumber(currentWeight);
  const parsedGoalWeight = parseNumber(goalWeight);
  const remaining =
    parsedCurrentWeight !== null && parsedGoalWeight !== null
      ? parsedCurrentWeight - parsedGoalWeight
      : null;
  const estimatedPace =
    weightChangeLast7 === null
      ? "Needs more data"
      : weightChangeLast7 < -0.2
        ? `${Math.abs(weightChangeLast7).toFixed(1)} lb / 7 logs`
        : "Holding steady";
  const coachMessage = getCoachMessage(coachStatus, streak);

  return (
    <section className="mt-8 space-y-5">
      <div className="overflow-hidden rounded-[2.25rem] border border-white/10 bg-slate-950 shadow-2xl shadow-black/40">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.55fr)]">
          <div className="p-5 sm:p-7 lg:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-400">
                  Progress
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">
                  Weight trend
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
                  Last {Math.min(saved.length, 30) || 0} check-ins. The goal is a steady trend,
                  not a perfect day.
                </p>
              </div>

              <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-black text-emerald-200">
                {coachMessage}
              </div>
            </div>

            <div className="mt-8 rounded-[2rem] border border-white/10 bg-black/30 p-4 sm:p-6">
              {weightGraph.length > 1 ? (
                <div className="relative h-56 sm:h-72">
                  <div className="absolute inset-0 grid grid-rows-4">
                    <div className="border-b border-white/[0.06]" />
                    <div className="border-b border-white/[0.06]" />
                    <div className="border-b border-white/[0.06]" />
                    <div />
                  </div>
                  <svg
                    className="absolute inset-0 h-full w-full overflow-visible"
                    preserveAspectRatio="none"
                    viewBox="0 0 100 100"
                  >
                    <polyline
                      fill="none"
                      points={points}
                      stroke="rgb(52 211 153)"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                  {weightGraph.map((item, index) => {
                    const left = weightGraph.length <= 1 ? 50 : (index / (weightGraph.length - 1)) * 100;
                    const bottom = item.weightPercent || 0;

                    return (
                      <div
                        key={item.date}
                        className="absolute h-3 w-3 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-slate-950 bg-emerald-300 shadow-lg shadow-emerald-400/30"
                        style={{ left: `${left}%`, bottom: `${bottom}%` }}
                        title={`${item.date}: ${item.weight?.toFixed(1)} lb`}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-56 items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 text-center text-sm leading-6 text-slate-500 sm:h-72">
                  Log weight on at least two check-ins to unlock the progress graph.
                </div>
              )}
            </div>
          </div>

          <aside className="border-t border-white/10 bg-white/[0.03] p-5 sm:p-7 lg:border-l lg:border-t-0 lg:p-8">
            <div className="grid gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  Current Weight
                </p>
                <p className="mt-2 text-4xl font-black tracking-tight text-white">
                  {currentWeight}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/25 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Goal Weight
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {goalWeight || "Set in profile"}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/25 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Total Change
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {weightChange ? `${weightChange} lb` : "-"}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/25 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Estimated Pace
                </p>
                <p className="mt-2 text-2xl font-black text-white">{estimatedPace}</p>
                {remaining !== null && (
                  <p className="mt-2 text-sm font-semibold text-slate-500">
                    {Math.abs(remaining).toFixed(1)} lb from goal
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {missingDates.length > 0 && (
        <div className="rounded-[1.75rem] border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
          <span className="font-black text-amber-300">Missing check-in:</span> oldest missing day is{" "}
          {missingDates[0]}.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-5 shadow-xl shadow-emerald-950/20 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-400/[0.13] lg:col-span-2">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
            Today&apos;s Cut Score
          </p>
          <p className="mt-3 text-5xl font-black text-white">
            {cutScore !== null && cutScore !== undefined ? Math.round(cutScore) : "--"}
          </p>
          <p className="mt-2 text-sm font-semibold text-emerald-100/70">
            {cutScore !== null && cutScore !== undefined
              ? "Coach analysis is ready."
              : "Finish today's check-in to score the day."}
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-950 p-5 shadow-xl shadow-black/20 transition duration-300 hover:-translate-y-0.5">
          <p className="text-sm font-semibold text-slate-400">Current Streak</p>
          <p className="mt-3 text-4xl font-black text-white">{streak}</p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            days
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-950 p-5 shadow-xl shadow-black/20 transition duration-300 hover:-translate-y-0.5">
          <p className="text-sm font-semibold text-slate-400">7-Day Avg Steps</p>
          <p className="mt-3 text-3xl font-black text-white">
            {avgSteps7?.toLocaleString() || "-"}
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            8k min / 10k ideal
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-950 p-5 shadow-xl shadow-black/20 transition duration-300 hover:-translate-y-0.5">
          <p className="text-sm font-semibold text-slate-400">Workout Consistency</p>
          <p className="mt-3 text-3xl font-black text-white">{workoutsLast7}/4</p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            last 7 days
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-950 p-5 shadow-xl shadow-black/20 transition duration-300 hover:-translate-y-0.5 sm:col-span-2 lg:col-span-2">
          <p className="text-sm font-semibold text-slate-400">Alcohol-Free Days</p>
          <p className="mt-3 text-4xl font-black text-white">{alcoholFreeDaysLast7}/7</p>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            {recentTrend.alcoholPattern}
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-950 p-5 shadow-xl shadow-black/20 transition duration-300 hover:-translate-y-0.5 sm:col-span-2 lg:col-span-3">
          <p className="text-sm font-semibold text-slate-400">Recent Trend</p>
          <p className="mt-3 text-xl font-black leading-7 text-white">
            {recentTrend.weightDirection}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {recentTrend.activityConsistency} {recentTrend.workoutConsistency}
          </p>
        </div>
      </div>
    </section>
  );
}
