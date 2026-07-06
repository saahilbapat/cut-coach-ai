"use client";

import type { FormEvent } from "react";
import type { CheckIn } from "../lib/types";

type CheckInFormProps = {
  form: CheckIn;
  isAnalyzing: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  updateField: (field: keyof CheckIn, value: string) => void;
};

export function CheckInForm({ form, isAnalyzing, onSubmit, updateField }: CheckInFormProps) {
  const foodGuidance =
    "Be as descriptive as you can. If you know portions, brands, restaurant names, sauces, or amounts, include them.";
  const input =
    "mt-2 w-full rounded-[1.35rem] border border-white/10 bg-black/35 px-4 py-4 text-base text-white outline-none transition duration-200 placeholder:text-slate-600 focus:border-emerald-300 focus:bg-black/50";
  const label = "block text-sm font-bold text-slate-300";
  const textarea =
    "mt-2 min-h-32 w-full rounded-[1.35rem] border border-white/10 bg-black/35 px-4 py-4 text-base leading-7 text-white outline-none transition duration-200 placeholder:text-slate-600 focus:border-emerald-300 focus:bg-black/50";
  const section =
    "rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 shadow-xl shadow-black/10 sm:p-6";
  const sectionTitle = "text-lg font-black tracking-tight text-white";
  const sectionCopy = "mt-1 text-sm leading-6 text-slate-500";

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[2.5rem] border border-white/10 bg-slate-950 p-5 shadow-2xl shadow-black/40 sm:p-7"
    >
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-400">
          Today&apos;s Check-In
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
          Tell the coach how today went.
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">Takes about one minute.</p>
      </div>

      <div className="mt-7 space-y-5">
        <div className={section}>
          <div>
            <h3 className={sectionTitle}>Body & Activity</h3>
            <p className={sectionCopy}>Weight, movement, and the daily baseline.</p>
          </div>

          <div className="mt-5">
            <label className={label}>Date</label>
            <input
              type="date"
              className={input}
              value={form.date}
              onChange={(event) => updateField("date", event.target.value)}
            />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>Weight</label>
              <input
                className={input}
                placeholder="160.2"
                value={form.weight}
                onChange={(event) => updateField("weight", event.target.value)}
              />
            </div>
            <div>
              <label className={label}>Steps</label>
              <input
                className={input}
                placeholder="10,000"
                value={form.steps}
                onChange={(event) => updateField("steps", event.target.value)}
              />
            </div>
          </div>
        </div>

        <div className={section}>
          <div>
            <h3 className={sectionTitle}>Training</h3>
            <p className={sectionCopy}>
              Add the workout type, exercises, sets/reps if you know them, effort, duration,
              and cardio details.
            </p>
          </div>

          <div className="mt-5">
            <label className={label}>Workout</label>
            <textarea
              className={textarea}
              placeholder="Push day: bench 3x8, shoulder press 3x10, triceps 3x12. Solid effort, 1-2 reps in reserve. 45 min lift, 20 min incline walk."
              value={form.workout}
              onChange={(event) => updateField("workout", event.target.value)}
            />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={label}>Workout Type</label>
              <select
                className={input}
                value={form.workoutType}
                onChange={(event) => updateField("workoutType", event.target.value)}
              >
                <option>Push</option>
                <option>Pull</option>
                <option>Legs</option>
                <option>Cardio</option>
                <option>Rest</option>
              </select>
            </div>
            <div>
              <label className={label}>Lift Duration</label>
              <input
                className={input}
                placeholder="45 min lift"
                value={form.workoutDuration}
                onChange={(event) => updateField("workoutDuration", event.target.value)}
              />
            </div>
            <div>
              <label className={label}>Cardio Duration</label>
              <input
                className={input}
                placeholder="20 min incline walk"
                value={form.cardioDuration}
                onChange={(event) => updateField("cardioDuration", event.target.value)}
              />
            </div>
          </div>

          <div className="mt-5">
            <label className={label}>Cardio Type</label>
            <input
              className={input}
              placeholder="Incline walk, run, bike, intervals, or none"
              value={form.cardioType}
              onChange={(event) => updateField("cardioType", event.target.value)}
            />
          </div>
        </div>

        <div className={section}>
          <div>
            <h3 className={sectionTitle}>Food & Drinks</h3>
            <p className={sectionCopy}>
              {foodGuidance} Example: 3 chicken tenderloins, 1 cup rice, Qdoba bowl
              with double chicken, light cheese, pico, corn salsa.
            </p>
          </div>

          <div className="mt-5">
            <label className={label}>Breakfast</label>
            <textarea
              className={textarea}
              placeholder={"Greek yogurt bowl\n1 cup Greek yogurt\nGranola\nBlueberries\nFairlife shake"}
              value={form.breakfast}
              onChange={(event) => updateField("breakfast", event.target.value)}
            />
          </div>

          <div className="mt-5">
            <label className={label}>Lunch</label>
            <textarea
              className={textarea}
              placeholder={"Qdoba bowl\nDouble chicken\nBrown rice\nLight cheese\nPico\nCorn salsa"}
              value={form.lunch}
              onChange={(event) => updateField("lunch", event.target.value)}
            />
          </div>

          <div className="mt-5">
            <label className={label}>Dinner</label>
            <textarea
              className={textarea}
              placeholder={"Grilled salmon\nPotatoes\nBig salad\nOlive oil dressing"}
              value={form.dinner}
              onChange={(event) => updateField("dinner", event.target.value)}
            />
          </div>

          <div className="mt-5">
            <label className={label}>Snacks</label>
            <textarea
              className={textarea}
              placeholder="Greek yogurt, protein bar, fruit, chips, dessert, or none"
              value={form.snacks}
              onChange={(event) => updateField("snacks", event.target.value)}
            />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>Alcohol</label>
              <input
                className={input}
                placeholder="None / 2 vodka sodas / 1 beer"
                value={form.alcohol}
                onChange={(event) => updateField("alcohol", event.target.value)}
              />
            </div>
            <div>
              <label className={label}>Water</label>
              <input
                className={input}
                placeholder="80 oz"
                value={form.water}
                onChange={(event) => updateField("water", event.target.value)}
              />
            </div>
          </div>
        </div>

        <div className={section}>
          <div>
            <h3 className={sectionTitle}>Mood & Notes</h3>
            <p className={sectionCopy}>Hunger, energy, and anything the numbers miss.</p>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={label}>Hunger</label>
              <input
                className={input}
                placeholder="1-10"
                value={form.hunger}
                onChange={(event) => updateField("hunger", event.target.value)}
              />
            </div>
            <div>
              <label className={label}>Energy</label>
              <input
                className={input}
                placeholder="1-10"
                value={form.energy}
                onChange={(event) => updateField("energy", event.target.value)}
              />
            </div>
            <div>
              <label className={label}>Mood</label>
              <input
                className={input}
                placeholder="1-10"
                value={form.mood}
                onChange={(event) => updateField("mood", event.target.value)}
              />
            </div>
          </div>

          <div className="mt-5">
            <label className={label}>Notes</label>
            <textarea
              className={`${textarea} min-h-36`}
              placeholder="Sleep, cravings, soreness, stress, wins, or anything the coach should know."
              value={form.notes}
              onChange={(event) => updateField("notes", event.target.value)}
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isAnalyzing}
        className="mt-7 w-full rounded-[2rem] bg-emerald-400 p-5 text-lg font-black text-black shadow-2xl shadow-emerald-400/25 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:translate-y-0 disabled:bg-slate-800 disabled:text-slate-400 disabled:shadow-none"
      >
        {isAnalyzing ? "Coach is reviewing your day..." : "✨ Finish Today's Check-In"}
      </button>

      {isAnalyzing && (
        <div className="mt-4 rounded-[1.5rem] border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm font-semibold text-emerald-100">
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-black/40">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-emerald-300" />
          </div>
          <div className="space-y-1 text-slate-300">
            <p>Estimating nutrition...</p>
            <p>Looking at your trends...</p>
            <p>Preparing tomorrow&apos;s coaching...</p>
          </div>
        </div>
      )}
    </form>
  );
}
