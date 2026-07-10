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

type AuthMode = "login" | "signup" | "forgot";

export function LoginForm({ initialMessage = "" }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(initialMessage);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");

  async function redirectAfterSignIn() {
    const supabase = createClient();
    const profile = await getProfile(supabase);
    router.replace(isProfileComplete(profile) ? "/" : "/profile");
    router.refresh();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setMessage("");

    try {
      const supabase = createClient();
      const trimmedEmail = email.trim();

      if (mode === "forgot") {
        if (!trimmedEmail) {
          setMessage("Enter your email first, then request a password reset.");
          return;
        }

        const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
          redirectTo: `${window.location.origin}/update-password`,
        });

        if (error) throw error;

        setMessage("Password reset sent. Check your email to set a new password.");
        return;
      }

      if (mode === "signup") {
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
          setMessage(
            "If this is a new account, check your email to confirm, then log in. If this email already has an account, use Log In or Forgot password."
          );
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
        mode === "signup"
          ? "[login] Could not create account:"
          : mode === "forgot"
            ? "[login] Could not send password reset:"
            : "[login] Could not sign in:",
        error instanceof Error ? error.message : "Unknown error"
      );
      if (mode === "signup") {
        setMessage(
          "Could not create account. If this email already has an account, log in or use Forgot password."
        );
      } else if (mode === "forgot") {
        setMessage("Could not send password reset. Check the email and try again.");
      } else {
        setMessage("Could not sign in. Check the email and password and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setMessage("");
  }

  const isLogin = mode === "login";
  const isSignup = mode === "signup";
  const isForgot = mode === "forgot";

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

      <div className="mt-6 grid grid-cols-2 gap-2 rounded-[1.5rem] border border-white/10 bg-black/25 p-1.5">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => switchMode("login")}
          className={
            isLogin
              ? "min-h-11 rounded-full bg-emerald-400 px-3 py-2 text-sm font-black text-black"
              : "min-h-11 rounded-full px-3 py-2 text-sm font-bold text-slate-400 transition hover:bg-white/[0.04] hover:text-white"
          }
        >
          Log In
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => switchMode("signup")}
          className={
            isSignup
              ? "min-h-11 rounded-full bg-emerald-400 px-3 py-2 text-sm font-black text-black"
              : "min-h-11 rounded-full px-3 py-2 text-sm font-bold text-slate-400 transition hover:bg-white/[0.04] hover:text-white"
          }
        >
          Create Account
        </button>
      </div>

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

      {!isForgot && (
        <>
          <label className="mt-5 block text-sm font-bold text-slate-300">Password</label>
          <input
            type="password"
            required
            minLength={6}
            autoComplete={isSignup ? "new-password" : "current-password"}
            className="mt-2 w-full rounded-[1.5rem] border border-white/10 bg-black/35 px-4 py-4 text-white outline-none placeholder:text-slate-600 focus:border-emerald-300"
            placeholder="At least 6 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </>
      )}

      {isSignup && (
        <>
          <label className="mt-5 block text-sm font-bold text-slate-300">
            Confirm Password
          </label>
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="mt-2 w-full rounded-[1.5rem] border border-white/10 bg-black/35 px-4 py-4 text-white outline-none placeholder:text-slate-600 focus:border-emerald-300"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </>
      )}

      {isForgot && (
        <p className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-slate-300">
          Enter the email for your existing account. We&apos;ll send one recovery email
          that lets you set a password without changing your user ID or data.
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-5 min-h-14 w-full rounded-[1.75rem] bg-emerald-400 p-4 font-black text-black shadow-xl shadow-emerald-400/20 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
      >
        {isSubmitting
          ? isForgot
            ? "Sending reset..."
            : isSignup
              ? "Creating..."
              : "Logging in..."
          : isForgot
            ? "Send Password Reset"
            : isSignup
              ? "Create Account"
              : "Log In"}
      </button>

      <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm font-bold">
        {!isForgot && (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => switchMode("forgot")}
            className="text-slate-400 transition hover:text-white disabled:text-slate-600"
          >
            Forgot password?
          </button>
        )}
        {isForgot && (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => switchMode("login")}
            className="text-slate-400 transition hover:text-white disabled:text-slate-600"
          >
            Back to login
          </button>
        )}
      </div>

      {message && (
        <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 text-sm font-semibold text-slate-200">
          {message}
        </div>
      )}
    </form>
  );
}
