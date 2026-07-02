"use client";

import { FoodMemory } from "../../components/FoodMemory";
import { MainNav } from "../../components/MainNav";

export default function FoodMemoryPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-5 text-white sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="rounded-[2.5rem] border border-white/10 bg-slate-950 p-5 shadow-2xl shadow-black/50 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-400">
            Cut Coach AI
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-6xl">
            Food Memory
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
            Remember common meals, restaurants, groceries, and snacks so future coaching
            becomes more consistent.
          </p>
        </header>

        <MainNav />

        <div className="mt-8">
          <FoodMemory />
        </div>
      </div>
    </main>
  );
}
