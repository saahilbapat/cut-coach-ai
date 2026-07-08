"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        const supabase = createClient();
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;

        if (!session) {
          setMessage("Open the password reset link from your email, then set a new password.");
        }
      } catch (error) {
        console.error(
          "[update-password] Could not read recovery session:",
          error instanceof Error ? error.message : "Unknown error"
        );
        setMessage("Could not verify the reset session. Request a new password reset.");
      } finally {
        setIsCheckingSession(false);
      }
    }

    checkSession();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error(
        "[update-password] Could not update password:",
        error instanceof Error ? error.message : "Unknown error"
      );
      setMessage("Could not update password. Request a new reset link and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-xl items-center">
        <form
          onSubmit={handleSubmit}
          className="w-full rounded-[2.5rem] border border-white/10 bg-slate-950 p-6 shadow-2xl shadow-black/40 sm:p-8"
        >
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-400">
            Account Security
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
            Set a new password
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-400">
            Choose a password for this account. Your check-ins, profile, and food memory
            stay attached to the same Supabase user.
          </p>

          <label className="mt-7 block text-sm font-bold text-slate-300">
            New Password
          </label>
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="mt-2 w-full rounded-[1.5rem] border border-white/10 bg-black/35 px-4 py-4 text-white outline-none placeholder:text-slate-600 focus:border-emerald-300"
            placeholder="At least 6 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <label className="mt-5 block text-sm font-bold text-slate-300">
            Confirm New Password
          </label>
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="mt-2 w-full rounded-[1.5rem] border border-white/10 bg-black/35 px-4 py-4 text-white outline-none placeholder:text-slate-600 focus:border-emerald-300"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />

          <button
            type="submit"
            disabled={isSubmitting || isCheckingSession}
            className="mt-5 min-h-14 w-full rounded-[1.75rem] bg-emerald-400 p-4 font-black text-black shadow-xl shadow-emerald-400/20 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
          >
            {isSubmitting ? "Updating..." : "Update Password"}
          </button>

          {message && (
            <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 text-sm font-semibold text-slate-200">
              {message}
            </div>
          )}
        </form>
      </div>
    </main>
  );
}
