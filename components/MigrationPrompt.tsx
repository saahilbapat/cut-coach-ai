"use client";

import { useEffect, useState } from "react";
import { emptyProfile } from "../lib/profile";
import {
  loadCheckIns,
  loadFoodMemory,
  loadProfile,
  loadStoredAnalyses,
} from "../lib/storage";
import { createClient } from "../lib/supabase/client";
import {
  getAnalyses,
  getCheckIns,
  getFoodMemory,
  getProfile,
  upsertAnalysis,
  upsertCheckIn,
  upsertFoodMemory,
  upsertProfile,
} from "../lib/supabase/queries";

const MIGRATION_KEY = "cut-supabase-migrated";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown error";
}

async function runImportStep<T>(label: string, action: () => Promise<T>) {
  try {
    return await action();
  } catch (error) {
    throw new Error(`${label} failed: ${getErrorMessage(error)}`);
  }
}

function hasLocalData() {
  return (
    loadCheckIns().length > 0 ||
    loadStoredAnalyses().length > 0 ||
    loadFoodMemory().length > 0 ||
    localStorage.getItem("cut-checkin-profile") !== null
  );
}

type MigrationPromptProps = {
  onImported: () => Promise<void> | void;
};

type MessageTone = "neutral" | "success" | "error";

export function MigrationPrompt({ onImported }: MigrationPromptProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<MessageTone>("neutral");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setIsVisible(localStorage.getItem(MIGRATION_KEY) !== "true" && hasLocalData());
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  async function importToAccount() {
    setIsImporting(true);
    setMessage("");
    setMessageTone("neutral");

    try {
      const supabase = createClient();
      const [remoteProfile, remoteCheckIns, remoteAnalyses, remoteFoodMemory] =
        await Promise.all([
          getProfile(supabase),
          getCheckIns(supabase),
          getAnalyses(supabase),
          getFoodMemory(supabase),
        ]);
      const localProfile = loadProfile(emptyProfile);
      const localCheckIns = loadCheckIns();
      const localAnalyses = loadStoredAnalyses();
      const localFoodMemory = loadFoodMemory();
      const foundCheckIns = localCheckIns.length;
      const foundFoodMemory = localFoodMemory.length;

      if (!remoteProfile) {
        await runImportStep("Profile import", () => upsertProfile(supabase, localProfile));
      }

      const remoteDates = new Set(remoteCheckIns.map((item) => item.date));
      let importedCheckIns = 0;
      for (const checkIn of localCheckIns) {
        if (!remoteDates.has(checkIn.date)) {
          await runImportStep(`Check-in import for ${checkIn.date}`, () =>
            upsertCheckIn(supabase, checkIn)
          );
          remoteDates.add(checkIn.date);
          importedCheckIns++;
        }
      }

      const remoteAnalysisKeys = new Set(
        remoteAnalyses.map((item) => `${item.date}:${item.signature}`)
      );
      for (const item of localAnalyses) {
        if (!remoteAnalysisKeys.has(`${item.date}:${item.signature}`)) {
          await runImportStep(`Analysis import for ${item.date}`, () =>
            upsertAnalysis(supabase, item.date, item.signature, item.analysis)
          );
          remoteAnalysisKeys.add(`${item.date}:${item.signature}`);
        }
      }

      const remoteFoodNames = new Set(
        remoteFoodMemory.flatMap((item) =>
          [item.name, ...item.aliases].map((value) => value.trim().toLowerCase())
        )
      );
      let importedFoodMemory = 0;
      for (const item of localFoodMemory) {
        const names = [item.name, ...item.aliases].map((value) =>
          value.trim().toLowerCase()
        );
        if (!names.some((name) => remoteFoodNames.has(name))) {
          await runImportStep(`Food memory import for ${item.name}`, () =>
            upsertFoodMemory(supabase, item)
          );
          names.forEach((name) => remoteFoodNames.add(name));
          importedFoodMemory++;
        }
      }

      await onImported();
      localStorage.setItem(MIGRATION_KEY, "true");
      const totalFound = foundCheckIns + foundFoodMemory;
      const totalImported = importedCheckIns + importedFoodMemory;

      if (totalFound === 0) {
        setMessageTone("neutral");
        setMessage(
          "No local check-ins or food memory were found to import on this device."
        );
      } else if (totalImported === 0) {
        setMessageTone("neutral");
        setMessage(
          `Found ${foundCheckIns} local check-ins and ${foundFoodMemory} food memory items. Imported 0 check-ins and 0 food memory items because those local items already exist in your account.`
        );
      } else {
        setMessageTone("success");
        setMessage(
          `Found ${foundCheckIns} local check-ins and ${foundFoodMemory} food memory items. Successfully imported ${importedCheckIns} check-ins and ${importedFoodMemory} food memory items.`
        );
      }
      setIsVisible(false);
    } catch (error) {
      console.error(error);
      setMessageTone("error");
      setMessage(`Import failed. Local data was not deleted. ${getErrorMessage(error)}`);
    } finally {
      setIsImporting(false);
    }
  }

  function dismiss() {
    setIsVisible(false);
  }

  if (!isVisible && !message) return null;

  const sectionClass =
    messageTone === "error"
      ? "mt-5 rounded-[2rem] border border-red-400/30 bg-red-400/10 p-5 text-red-50 shadow-xl shadow-black/20"
      : messageTone === "success"
        ? "mt-5 rounded-[2rem] border border-emerald-400/30 bg-emerald-400/10 p-5 text-emerald-50 shadow-xl shadow-black/20"
        : "mt-5 rounded-[2rem] border border-white/10 bg-slate-950 p-5 text-slate-100 shadow-xl shadow-black/20";

  return (
    <section className={sectionClass}>
      {message && (
        <p className="mb-4 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm font-semibold">
          {message}
        </p>
      )}
      {isVisible ? (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-black">We found saved data on this device.</p>
            <p className="mt-1 text-sm leading-6 text-emerald-100/80">
              Move it to your account so it syncs across phone and computer?
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={importToAccount}
              disabled={isImporting}
              className="rounded-full bg-emerald-300 px-4 py-2 text-sm font-black text-black disabled:bg-slate-700 disabled:text-slate-400"
            >
              {isImporting ? "Importing..." : "Import to account"}
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm font-black text-emerald-100"
            >
              Not now
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
