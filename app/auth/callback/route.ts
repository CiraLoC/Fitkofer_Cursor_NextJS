import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server-client";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextPath = url.searchParams.get("next") ?? "/onboarding";

  if (!code) {
    return NextResponse.redirect(new URL("/signup?error=missing_code", request.url));
  }

  const supabase = createServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Auth callback error", error);
    return NextResponse.redirect(new URL("/signup?error=auth_callback", request.url));
  }

  return NextResponse.redirect(new URL(nextPath, request.url));
}
