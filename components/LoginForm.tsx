"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { isProfileComplete } from "../lib/profile";
import { createClient } from "../lib/supabase/client";
import { getProfile } from "../lib/supabase/queries";

type LoginFormProps = {
  initialMessage?: string;
};

export function LoginForm({ initialMessage = "" }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(initialMessage);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [action, setAction] = useState<"signin" | "signup" | "reset">("signin");

  async function redirectAfterSignIn() {
    const supabase = createClient();
    const profile = await getProfile(supabase);
    router.replace(isProfileComplete(profile) ? "/" : "/profile");
    router.refresh();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const nextAction =
      submitter instanceof HTMLButtonElement && submitter.value === "signup"
        ? "signup"
        : "signin";

    setIsSubmitting(true);
    setAction(nextAction);
    setMessage("");

    try {
      const supabase = createClient();
      const trimmedEmail = email.trim();

      if (nextAction === "signup") {
        if (password.length < 6) {
          setMessage("Password must be at least 6 characters.");
          return;
        }

        if (password !== confirmPassword) {
          setMessage("Passwords do not match.");
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
        });

        if (error) throw error;

        if (!data.session) {
          setMessage("Account created. Check your email to confirm, then log in.");
          return;
        }

        router.replace("/profile");
        router.refresh();
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) throw error;

      await redirectAfterSignIn();
    } catch (error) {
      console.error(
        nextAction === "signup" ? "[login] Could not create account:" : "[login] Could not sign in:",
        error instanceof Error ? error.message : "Unknown error"
      );
      setMessage(
        nextAction === "signup"
          ? "Could not create account. Check the email and password and try again."
          : "Could not sign in. Check the email and password and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function sendPasswordReset() {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setMessage("Enter your email first, then request a password reset.");
      return;
    }

    setIsSubmitting(true);
    setAction("reset");
    setMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) throw error;

      setMessage("Password reset sent. Check your email to set a new password.");
    } catch (error) {
      console.error(
        "[login] Could not send password reset:",
        error instanceof Error ? error.message : "Unknown error"
      );
      setMessage("Could not send password reset. Check the email and try again.");
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
        Log in to Cut Coach AI
      </h1>
      <p className="mt-4 text-sm leading-6 text-slate-400">
        Create an account or log in to sync check-ins, analysis, profile, and food memory
        across phone and computer.
      </p>

      <label className="mt-7 block text-sm font-bold text-slate-300">Email</label>
      <input
        type="email"
        required
        autoComplete="email"
        className="mt-2 w-full rounded-[1.5rem] border border-white/10 bg-black/35 px-4 py-4 text-white outline-none placeholder:text-slate-600 focus:border-emerald-300"
        placeholder="you@example.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />

      <label className="mt-5 block text-sm font-bold text-slate-300">Password</label>
      <input
        type="password"
        required
        minLength={6}
        autoComplete={action === "signup" ? "new-password" : "current-password"}
        className="mt-2 w-full rounded-[1.5rem] border border-white/10 bg-black/35 px-4 py-4 text-white outline-none placeholder:text-slate-600 focus:border-emerald-300"
        placeholder="At least 6 characters"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />

      <label className="mt-5 block text-sm font-bold text-slate-300">
        Confirm Password <span className="text-slate-500">(new accounts)</span>
      </label>
      <input
        type="password"
        minLength={6}
        autoComplete="new-password"
        className="mt-2 w-full rounded-[1.5rem] border border-white/10 bg-black/35 px-4 py-4 text-white outline-none placeholder:text-slate-600 focus:border-emerald-300"
        placeholder="Re-enter password to create account"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
      />

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          type="submit"
          value="signin"
          disabled={isSubmitting}
          className="min-h-14 rounded-[1.75rem] bg-emerald-400 p-4 font-black text-black shadow-xl shadow-emerald-400/20 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
        >
          {isSubmitting && action === "signin" ? "Logging in..." : "Log In"}
        </button>

        <button
          type="submit"
          value="signup"
          disabled={isSubmitting}
          className="min-h-14 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-4 font-black text-slate-100 transition duration-300 hover:-translate-y-0.5 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:bg-slate-900 disabled:text-slate-500"
        >
          {isSubmitting && action === "signup" ? "Creating..." : "Create Account"}
        </button>
      </div>

      <button
        type="button"
        disabled={isSubmitting}
        onClick={sendPasswordReset}
        className="mt-4 min-h-12 w-full rounded-[1.5rem] px-4 py-3 text-sm font-bold text-slate-300 transition duration-200 hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:text-slate-600"
      >
        {isSubmitting && action === "reset" ? "Sending reset..." : "Forgot password?"}
      </button>

      {message && (
        <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 text-sm font-semibold text-slate-200">
          {message}
        </div>
      )}
    </form>
  );
}
