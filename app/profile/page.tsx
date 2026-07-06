"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { MainNav } from "../../components/MainNav";
import {
  cutConcernOptions,
  emptyProfile,
  isProfileComplete,
  validateProfile,
} from "../../lib/profile";
import { loadProfile, saveProfile } from "../../lib/storage";
import { createClient } from "../../lib/supabase/client";
import { getProfile, upsertProfile } from "../../lib/supabase/queries";
import type { UserProfile } from "../../lib/types";

const input =
  "mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-green-400";
const label = "block text-sm font-semibold text-slate-300";
const textarea =
  "mt-2 min-h-24 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-green-400";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>(emptyProfile);
  const [errors, setErrors] = useState<Partial<Record<keyof UserProfile, string>>>({});
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [wasIncompleteOnLoad, setWasIncompleteOnLoad] = useState(false);

  useEffect(() => {
    async function loadProfileData() {
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

        const cloudProfile = await getProfile(supabase);
        const nextProfile = cloudProfile || loadProfile(emptyProfile);
        setProfile(nextProfile);
        setWasIncompleteOnLoad(!isProfileComplete(nextProfile));
        saveProfile(nextProfile);
      } catch (error) {
        console.error(error);
        const localProfile = loadProfile(emptyProfile);
        setProfile(localProfile);
        setWasIncompleteOnLoad(!isProfileComplete(localProfile));
        setMessage("Loaded local profile cache because cloud data could not be reached.");
      } finally {
        setIsLoading(false);
      }
    }

    loadProfileData();
  }, [router]);

  function updateField(field: keyof UserProfile, value: string) {
    setProfile((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function toggleConcern(concern: string) {
    setProfile((current) => {
      const currentConcerns = current.cutConcerns || [];
      const isSelected = currentConcerns.includes(concern);

      return {
        ...current,
        cutConcerns: isSelected
          ? currentConcerns.filter((item) => item !== concern)
          : [...currentConcerns, concern],
      };
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateProfile(profile);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setMessage("Fix the highlighted fields before saving.");
      return;
    }

    try {
      const savedProfile = await upsertProfile(createClient(), profile);
      saveProfile(savedProfile);
      setProfile(savedProfile);
      setMessage("Profile saved. Future analyses will use these goals.");
      if (wasIncompleteOnLoad) {
        router.replace("/");
      }
    } catch (error) {
      console.error(error);
      saveProfile(profile);
      setMessage("Saved locally because cloud profile save failed.");
    }
  }

  function errorFor(field: keyof UserProfile) {
    return errors[field] ? <p className="mt-1 text-xs font-semibold text-red-300">{errors[field]}</p> : null;
  }

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white">
      <div className="mx-auto w-full max-w-lg">
        <p className="text-sm font-bold tracking-wide text-green-400">CUT CHECK-IN</p>
        <h1 className="mt-1 text-4xl font-black">Profile</h1>
        <MainNav />

        {isLoading && (
          <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm font-semibold text-slate-300">
            Loading synced profile...
          </div>
        )}

        {message && (
          <div className="mt-5 rounded-2xl border border-green-500/40 bg-green-500/10 p-4 text-sm font-semibold text-green-300">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="text-2xl font-black">Goals & Preferences</h2>
          <p className="mt-2 text-sm text-slate-400">
            These settings stay on this device for now and personalize future check-in analyses.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Name</label>
              <input className={input} value={profile.name} onChange={(e) => updateField("name", e.target.value)} />
              {errorFor("name")}
            </div>
            <div>
              <label className={label}>Age</label>
              <input className={input} inputMode="numeric" value={profile.age} onChange={(e) => updateField("age", e.target.value)} />
              {errorFor("age")}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Height</label>
              <input className={input} placeholder="5'10&quot;" value={profile.height} onChange={(e) => updateField("height", e.target.value)} />
            </div>
            <div>
              <label className={label}>Sex</label>
              <select className={input} value={profile.sex} onChange={(e) => updateField("sex", e.target.value)}>
                <option value="">Select</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
                <option>Prefer not to say</option>
              </select>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Current Weight</label>
              <input className={input} inputMode="decimal" placeholder="180" value={profile.currentWeight} onChange={(e) => updateField("currentWeight", e.target.value)} />
              {errorFor("currentWeight")}
            </div>
            <div>
              <label className={label}>Goal Weight</label>
              <input className={input} inputMode="decimal" placeholder="165" value={profile.goalWeight} onChange={(e) => updateField("goalWeight", e.target.value)} />
              {errorFor("goalWeight")}
            </div>
          </div>

          <label className="mt-4 block text-sm font-semibold text-slate-300">Goal Pace</label>
          <select className={input} value={profile.goalPace} onChange={(e) => updateField("goalPace", e.target.value)}>
            <option>Slow Cut</option>
            <option>Moderate Cut</option>
            <option>Aggressive Cut</option>
          </select>

          <label className="mt-4 block text-sm font-semibold text-slate-300">Activity Level</label>
          <select className={input} value={profile.activityLevel} onChange={(e) => updateField("activityLevel", e.target.value)}>
            <option value="">Select</option>
            <option>Sedentary</option>
            <option>Lightly Active</option>
            <option>Moderately Active</option>
            <option>Very Active</option>
          </select>

          <label className="mt-4 block text-sm font-semibold text-slate-300">
            Preferred Protein Goal <span className="text-slate-500">(optional)</span>
          </label>
          <input className={input} placeholder="180g/day" value={profile.preferredProteinGoal} onChange={(e) => updateField("preferredProteinGoal", e.target.value)} />

          <label className="mt-4 block text-sm font-semibold text-slate-300">Dietary Preferences</label>
          <textarea className={textarea} placeholder="High protein, lower dairy, no pork..." value={profile.dietaryPreferences} onChange={(e) => updateField("dietaryPreferences", e.target.value)} />

          <label className="mt-4 block text-sm font-semibold text-slate-300">Favorite Restaurants</label>
          <textarea className={textarea} placeholder="Chipotle, Cava, Sweetgreen..." value={profile.favoriteRestaurants} onChange={(e) => updateField("favoriteRestaurants", e.target.value)} />

          <label className="mt-4 block text-sm font-semibold text-slate-300">Common Grocery Stores</label>
          <textarea className={textarea} placeholder="Trader Joe's, Costco, Whole Foods..." value={profile.commonGroceryStores} onChange={(e) => updateField("commonGroceryStores", e.target.value)} />

          <label className="mt-4 block text-sm font-semibold text-slate-300">Favorite Foods</label>
          <textarea className={textarea} placeholder="Chicken bowls, eggs, Greek yogurt..." value={profile.favoriteFoods} onChange={(e) => updateField("favoriteFoods", e.target.value)} />

          <div className="mt-6 rounded-3xl border border-slate-800 bg-black/20 p-4">
            <h3 className="text-xl font-black">Biggest Cut Concerns</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Pick the areas your coach should monitor more closely during analysis.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {cutConcernOptions.map((concern) => {
                const isSelected = (profile.cutConcerns || []).includes(concern);

                return (
                  <button
                    key={concern}
                    type="button"
                    onClick={() => toggleConcern(concern)}
                    className={
                      isSelected
                        ? "rounded-2xl border border-green-400/50 bg-green-500/15 px-4 py-3 text-left text-sm font-bold text-green-200"
                        : "rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-left text-sm font-bold text-slate-300"
                    }
                  >
                    {concern}
                  </button>
                );
              })}
            </div>

            <label className="mt-5 block text-sm font-semibold text-slate-300">
              Anything specific you want your coach to watch for?
            </label>
            <textarea
              className={textarea}
              placeholder="Example: Watch for weekend overeating, missed workouts, or restaurant choices that look healthy but get too calorie-dense."
              value={profile.cutConcernNotes}
              onChange={(e) => updateField("cutConcernNotes", e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="mt-6 w-full rounded-2xl bg-green-500 p-4 text-lg font-black text-black"
          >
            Save Profile
          </button>
        </form>
      </div>
    </main>
  );
}
