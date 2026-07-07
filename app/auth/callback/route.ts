import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isProfileComplete } from "../../../lib/profile";
import { createClient } from "../../../lib/supabase/server";
import { getProfile } from "../../../lib/supabase/queries";

const AUTH_CALLBACK_ERROR_MESSAGE =
  "The login link could not be verified. Request a new magic link.";

function redirectToLogin(requestUrl: URL) {
  const url = new URL("/login", requestUrl.origin);
  url.searchParams.set("error", "auth_callback_failed");
  url.searchParams.set("message", AUTH_CALLBACK_ERROR_MESSAGE);
  return NextResponse.redirect(url);
}

async function getDestination(supabase: SupabaseClient) {
  try {
    const profile = await getProfile(supabase);
    return isProfileComplete(profile) ? "/" : "/profile";
  } catch (error) {
    console.warn(
      "[auth/callback] Profile lookup failed after auth:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return "/profile";
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    console.warn("[auth/callback] Missing auth code.");
    return redirectToLogin(requestUrl);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.warn("[auth/callback] Code exchange failed:", error.message);
    return redirectToLogin(requestUrl);
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.warn("[auth/callback] Session verification failed:", userError?.message);
    return redirectToLogin(requestUrl);
  }

  const destination = await getDestination(supabase);

  return NextResponse.redirect(new URL(destination, requestUrl.origin));
}
