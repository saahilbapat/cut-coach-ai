"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  addOrUpdateFoodMemory,
  deleteFoodMemory,
  loadFoodMemory,
} from "../lib/storage";
import type { FoodMemoryItem } from "../lib/types";

const emptyForm = {
  name: "",
  aliases: "",
  category: "other" as FoodMemoryItem["category"],
  description: "",
  estimatedCalories: "",
  estimatedProtein: "",
  estimatedCarbs: "",
  estimatedFat: "",
  confidence: "medium" as NonNullable<FoodMemoryItem["confidence"]>,
};

const categories: FoodMemoryItem["category"][] = [
  "restaurant",
  "grocery",
  "homemade",
  "drink",
  "snack",
  "other",
];

const confidenceLevels: NonNullable<FoodMemoryItem["confidence"]>[] = [
  "low",
  "medium",
  "high",
];

function splitAliases(value: string) {
  return value
    .split(/,|\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinAliases(value: string[]) {
  return value.join(", ");
}

export function FoodMemory() {
  const [items, setItems] = useState<FoodMemoryItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setItems(loadFoodMemory());
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId("");
  }

  function editItem(item: FoodMemoryItem) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      aliases: joinAliases(item.aliases),
      category: item.category,
      description: item.description,
      estimatedCalories: item.estimatedCalories || "",
      estimatedProtein: item.estimatedProtein || "",
      estimatedCarbs: item.estimatedCarbs || "",
      estimatedFat: item.estimatedFat || "",
      confidence: item.confidence || "medium",
    });
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      setMessage("Name is required.");
      return;
    }

    const now = new Date().toISOString();
    const existing = editingId ? items.find((item) => item.id === editingId) : null;
    const nextItem: FoodMemoryItem = {
      id: editingId || `food-${Date.now()}`,
      name: form.name.trim(),
      aliases: splitAliases(form.aliases),
      category: form.category,
      description: form.description.trim(),
      estimatedCalories: form.estimatedCalories.trim() || undefined,
      estimatedProtein: form.estimatedProtein.trim() || undefined,
      estimatedCarbs: form.estimatedCarbs.trim() || undefined,
      estimatedFat: form.estimatedFat.trim() || undefined,
      confidence: form.confidence,
      source: "manual",
      timesSeen: existing?.timesSeen || 0,
      lastSeen: existing?.lastSeen || "",
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    const next = addOrUpdateFoodMemory(nextItem);
    setItems(next);
    setMessage(editingId ? "Food memory updated." : "Food memory added.");
    resetForm();
  }

  function handleDelete(id: string) {
    const next = deleteFoodMemory(id);
    setItems(next);
    if (editingId === id) resetForm();
    setMessage("Food memory deleted.");
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className="rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm font-semibold text-emerald-200">
          {message}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-[2.5rem] border border-white/10 bg-slate-950 p-5 shadow-2xl shadow-black/40 sm:p-7"
      >
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-400">
            Manual Memory
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
            {editingId ? "Edit food memory" : "Add a remembered food"}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Save meals, restaurants, groceries, and common snacks the coach should remember.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-bold text-slate-300">Name</label>
            <input
              className="mt-2 w-full rounded-[1.35rem] border border-white/10 bg-black/35 px-4 py-4 text-white outline-none placeholder:text-slate-600 focus:border-emerald-300"
              placeholder="Usual Qdoba bowl"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-300">Category</label>
            <select
              className="mt-2 w-full rounded-[1.35rem] border border-white/10 bg-black/35 px-4 py-4 text-white outline-none focus:border-emerald-300"
              value={form.category}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  category: event.target.value as FoodMemoryItem["category"],
                }))
              }
            >
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="text-sm font-bold text-slate-300">Aliases</label>
          <input
            className="mt-2 w-full rounded-[1.35rem] border border-white/10 bg-black/35 px-4 py-4 text-white outline-none placeholder:text-slate-600 focus:border-emerald-300"
            placeholder="Qdoba bowl, double chicken bowl"
            value={form.aliases}
            onChange={(event) => setForm((current) => ({ ...current, aliases: event.target.value }))}
          />
        </div>

        <div className="mt-4">
          <label className="text-sm font-bold text-slate-300">Description</label>
          <textarea
            className="mt-2 min-h-28 w-full rounded-[1.35rem] border border-white/10 bg-black/35 px-4 py-4 text-white outline-none placeholder:text-slate-600 focus:border-emerald-300"
            placeholder="Double protein, rice, veggies, salsa, no queso."
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="text-sm font-bold text-slate-300">Calories</label>
            <input
              className="mt-2 w-full rounded-[1.35rem] border border-white/10 bg-black/35 px-4 py-4 text-white outline-none placeholder:text-slate-600 focus:border-emerald-300"
              placeholder="750-900"
              value={form.estimatedCalories}
              onChange={(event) =>
                setForm((current) => ({ ...current, estimatedCalories: event.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-300">Protein</label>
            <input
              className="mt-2 w-full rounded-[1.35rem] border border-white/10 bg-black/35 px-4 py-4 text-white outline-none placeholder:text-slate-600 focus:border-emerald-300"
              placeholder="60-80g"
              value={form.estimatedProtein}
              onChange={(event) =>
                setForm((current) => ({ ...current, estimatedProtein: event.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-300">Carbs</label>
            <input
              className="mt-2 w-full rounded-[1.35rem] border border-white/10 bg-black/35 px-4 py-4 text-white outline-none placeholder:text-slate-600 focus:border-emerald-300"
              placeholder="70-95g"
              value={form.estimatedCarbs}
              onChange={(event) =>
                setForm((current) => ({ ...current, estimatedCarbs: event.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-300">Fat</label>
            <input
              className="mt-2 w-full rounded-[1.35rem] border border-white/10 bg-black/35 px-4 py-4 text-white outline-none placeholder:text-slate-600 focus:border-emerald-300"
              placeholder="20-35g"
              value={form.estimatedFat}
              onChange={(event) =>
                setForm((current) => ({ ...current, estimatedFat: event.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-300">Confidence</label>
            <select
              className="mt-2 w-full rounded-[1.35rem] border border-white/10 bg-black/35 px-4 py-4 text-white outline-none focus:border-emerald-300"
              value={form.confidence}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  confidence: event.target.value as NonNullable<FoodMemoryItem["confidence"]>,
                }))
              }
            >
              {confidenceLevels.map((confidence) => (
                <option key={confidence}>{confidence}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            className="rounded-[1.75rem] bg-emerald-400 px-6 py-4 font-black text-black shadow-xl shadow-emerald-400/20 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-300"
          >
            {editingId ? "Save Changes" : "Add Food Memory"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] px-6 py-4 font-black text-slate-300"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <section className="rounded-[2.5rem] border border-white/10 bg-slate-950 p-5 shadow-2xl shadow-black/40 sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-400">
              Saved Memory
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
              Foods your coach remembers
            </h2>
          </div>
          <p className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-slate-400">
            {items.length} saved
          </p>
        </div>

        {items.length === 0 ? (
          <p className="mt-6 rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 text-sm leading-6 text-slate-400">
            Your coach will start remembering common foods as you log more days.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {items.map((item) => (
              <article
                key={item.id}
                className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xl font-black text-white">{item.name}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
                  </div>
                  <p className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
                    {item.category}
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-[1.25rem] bg-black/30 p-3">
                    <p className="text-slate-500">Aliases</p>
                    <p className="mt-1 font-bold text-slate-200">
                      {item.aliases.length > 0 ? item.aliases.join(", ") : "-"}
                    </p>
                  </div>
                  <div className="rounded-[1.25rem] bg-black/30 p-3">
                    <p className="text-slate-500">Confidence</p>
                    <p className="mt-1 font-bold text-slate-200">{item.confidence || "-"}</p>
                  </div>
                  <div className="rounded-[1.25rem] bg-black/30 p-3">
                    <p className="text-slate-500">Estimates</p>
                    <p className="mt-1 font-bold text-slate-200">
                      {[item.estimatedCalories, item.estimatedProtein, item.estimatedCarbs, item.estimatedFat]
                        .filter(Boolean)
                        .join(" / ") || "-"}
                    </p>
                  </div>
                  <div className="rounded-[1.25rem] bg-black/30 p-3">
                    <p className="text-slate-500">Times Seen</p>
                    <p className="mt-1 font-bold text-slate-200">{item.timesSeen}</p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => editItem(item)}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-slate-200"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="rounded-full border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm font-bold text-red-200"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
