"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { createClient } from "../lib/supabase/client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) throw error;

      setMessage("Check your email for a magic login link.");
    } catch (error) {
      console.error(error);
      setMessage("Could not send login link. Check the email and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[2.5rem] border border-white/10 bg-slate-950 p-6 shadow-2xl shadow-black/40 sm:p-8"
    >
      <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-400">
        Cloud Sync
      </p>
      <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
        Sign in to Cut Coach AI
      </h1>
      <p className="mt-4 text-sm leading-6 text-slate-400">
        Use the same email on your phone and computer to keep check-ins, analysis,
        profile, and food memory synced.
      </p>

      <label className="mt-7 block text-sm font-bold text-slate-300">Email</label>
      <input
        type="email"
        required
        className="mt-2 w-full rounded-[1.5rem] border border-white/10 bg-black/35 px-4 py-4 text-white outline-none placeholder:text-slate-600 focus:border-emerald-300"
        placeholder="you@example.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-5 w-full rounded-[1.75rem] bg-emerald-400 p-4 font-black text-black shadow-xl shadow-emerald-400/20 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
      >
        {isSubmitting ? "Sending link..." : "Send Magic Link"}
      </button>

      {message && (
        <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 text-sm font-semibold text-slate-200">
          {message}
        </div>
      )}
    </form>
  );
}
