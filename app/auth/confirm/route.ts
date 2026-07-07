import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "../../../lib/supabase/server";

function redirectToLogin(requestUrl: URL) {
  const url = new URL("/login", requestUrl.origin);
  url.searchParams.set("error", "login_link_not_verified");
  return NextResponse.redirect(url);
}

function getSafeNextPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));

  if (!tokenHash || !type) {
    console.warn("[auth/confirm] Missing token hash or type.");
    return redirectToLogin(requestUrl);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as EmailOtpType,
  });

  if (error) {
    console.warn("[auth/confirm] OTP verification failed:", error.message);
    return redirectToLogin(requestUrl);
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
