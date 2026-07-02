"use client";

import { useState } from "react";
import type { CheckIn } from "../lib/types";

type CheckInHistoryProps = {
  saved: CheckIn[];
  loadCheckIn: (checkIn: CheckIn) => void;
};

export function CheckInHistory({ saved, loadCheckIn }: CheckInHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const sortedCheckIns = [...saved].reverse();
  const visibleCheckIns = isExpanded ? sortedCheckIns : sortedCheckIns.slice(0, 2);
  const shouldShowToggle = saved.length > 2;

  return (
    <section className="rounded-[2.25rem] border border-white/10 bg-slate-950/90 p-5 shadow-2xl shadow-black/30 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-400">
            Check-Ins
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white">History</h2>
          <p className="mt-1 text-sm text-slate-500">
            Stored locally. Recent entries stay collapsed by default.
          </p>
        </div>
        <p className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-slate-400">
          {saved.length} saved
        </p>
      </div>

      {saved.length === 0 ? (
        <p className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-4 text-slate-400">
          No check-ins saved yet.
        </p>
      ) : (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {visibleCheckIns.map((item) => (
            <button
              key={item.date}
              onClick={() => loadCheckIn(item)}
              className="w-full rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-4 text-left transition duration-300 hover:-translate-y-0.5 hover:bg-white/[0.06]"
            >
              <div className="flex items-center justify-between">
                <p className="font-bold text-white">{item.date}</p>
                <p className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
                  View / Edit
                </p>
              </div>
              <p className="mt-2 text-sm text-slate-400">
                {item.workoutType} · {item.steps || "No steps"} steps ·{" "}
                {item.alcohol || "No alcohol"}
              </p>
            </button>
          ))}

          {shouldShowToggle && (
            <button
              type="button"
              onClick={() => setIsExpanded((current) => !current)}
              className="rounded-[1.75rem] border border-emerald-400/40 bg-emerald-400/10 p-4 font-black text-emerald-300 transition duration-300 hover:bg-emerald-400/15 md:col-span-2"
            >
              {isExpanded ? "Show Less" : "View All Check-Ins"}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
