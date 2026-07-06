import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

const AUTH_ERROR_MESSAGES = {
  missing_code: "The login link is missing an auth code. Request a new magic link.",
  exchange_failed: "The login link could not be verified. Request a new magic link.",
  session_missing: "The login session could not be created. Request a new magic link.",
};

function redirectToLogin(requestUrl: URL, error: keyof typeof AUTH_ERROR_MESSAGES) {
  const url = new URL("/login", requestUrl.origin);
  url.searchParams.set("error", error);
  url.searchParams.set("message", AUTH_ERROR_MESSAGES[error]);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    console.warn("[auth/callback] Missing auth code.");
    return redirectToLogin(requestUrl, "missing_code");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.warn("[auth/callback] Code exchange failed:", error.message);
    return redirectToLogin(requestUrl, "exchange_failed");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.warn("[auth/callback] Session verification failed:", userError?.message);
    return redirectToLogin(requestUrl, "session_missing");
  }

  return NextResponse.redirect(new URL("/", requestUrl.origin));
}
